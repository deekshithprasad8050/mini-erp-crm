import request from 'supertest';
import app from '../app';

let adminToken: string;
let warehouseToken: string;
let testCustomerId: string;
let testProductId: string;
let draftChallanId: string;

beforeAll(async () => {
    // login to get tokens
    const adminRes = await request(app).post('/api/auth').send({
        email: 'admin@example.com',
        password: 'Password123!'
    });
    adminToken = adminRes.body.data.token;

    const warehouseRes = await request(app).post('/api/auth').send({
        email: 'warehouse@example.com',
        password: 'Password123!'
    });
    warehouseToken = warehouseRes.body.data.token;
});

describe('Mini ERP API Tests', () => {

    // 1. Login works with valid credentials
    it('should login successfully with valid credentials', async () => {
        const res = await request(app).post('/api/auth').send({
            email: 'admin@example.com',
            password: 'Password123!'
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    // 2. Invalid login fails
    it('should fail login with invalid credentials', async () => {
        const res = await request(app).post('/api/auth').send({
            email: 'admin@example.com',
            password: 'wrongpassword'
        });
        expect(res.status).toBe(401);
    });

    // 3. Customer creation works
    it('should create a customer with valid data', async () => {
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                customerName: 'Test Customer',
                mobileNumber: '9999999999',
                businessName: 'Test Business',
                customerType: 'RETAIL',
                address: '123 Test St'
            });
        expect(res.status).toBe(201);
        testCustomerId = res.body.data.id;
        expect(testCustomerId).toBeDefined();
    });

    // 4. Product creation works
    it('should create a product with valid data', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                productName: 'Test Product',
                sku: `TEST-SKU-${Date.now()}`,
                category: 'Electronics',
                unitPrice: 100,
                minimumStock: 10,
                warehouseLocation: 'A1'
            });
        expect(res.status).toBe(201);
        testProductId = res.body.data.id;
        expect(testProductId).toBeDefined();
        expect(res.body.data.currentStock).toBe(0);
    });

    // 5. Stock IN works
    it('should add stock successfully', async () => {
        const res = await request(app)
            .post(`/api/products/${testProductId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                quantityChanged: 50,
                movementType: 'IN',
                reason: 'Initial stock'
            });
        expect(res.status).toBe(200);
        
        const productRes = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(productRes.body.data.currentStock).toBe(50);
    });

    // 6. Stock OUT works
    it('should remove stock successfully', async () => {
        const res = await request(app)
            .post(`/api/products/${testProductId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                quantityChanged: 10,
                movementType: 'OUT',
                reason: 'Damaged'
            });
        expect(res.status).toBe(200);

        const productRes = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(productRes.body.data.currentStock).toBe(40); // 50 - 10
    });

    // 7. Negative stock is rejected
    it('should reject stock OUT if quantity exceeds available', async () => {
        const res = await request(app)
            .post(`/api/products/${testProductId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                quantityChanged: 100,
                movementType: 'OUT',
                reason: 'Excessive remove'
            });
        expect(res.status).toBe(400);
    });

    // 8. Draft challan does NOT reduce stock
    it('should create a draft challan without reducing stock', async () => {
        const res = await request(app)
            .post('/api/challans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                customerId: testCustomerId,
                items: [
                    { productId: testProductId, quantity: 5 }
                ]
            });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('DRAFT');
        draftChallanId = res.body.data.id;

        const productRes = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(productRes.body.data.currentStock).toBe(40); // unchanged
    });

    // 9. Confirmed challan reduces stock
    it('should reduce stock when draft challan is confirmed', async () => {
        const res = await request(app)
            .post(`/api/challans/${draftChallanId}/confirm`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('CONFIRMED');

        const productRes = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(productRes.body.data.currentStock).toBe(35); // 40 - 5
    });

    // 10. Insufficient stock prevents confirmation
    it('should fail to confirm challan if stock is insufficient', async () => {
        const draftRes = await request(app)
            .post('/api/challans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                customerId: testCustomerId,
                items: [
                    { productId: testProductId, quantity: 100 }
                ]
            });
        const largeDraftId = draftRes.body.data.id;

        const confirmRes = await request(app)
            .post(`/api/challans/${largeDraftId}/confirm`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();
        expect(confirmRes.status).toBe(400);
        expect(confirmRes.body.message).toMatch(/Insufficient stock/);
    });

    // 11. Multi-product confirmation is atomic (if one product fails, no stock changes)
    it('should be atomic for multi-product confirmation', async () => {
        // Create a second product
        const prodRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                productName: 'Test Product 2',
                sku: `TEST-SKU-2-${Date.now()}`,
                category: 'Electronics',
                unitPrice: 50,
                minimumStock: 5,
                warehouseLocation: 'A2'
            });
        const prod2Id = prodRes.body.data.id;
        
        await request(app)
            .post(`/api/products/${prod2Id}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ quantityChanged: 10, movementType: 'IN', reason: 'Init' });

        const draftRes = await request(app)
            .post('/api/challans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                customerId: testCustomerId,
                items: [
                    { productId: testProductId, quantity: 5 }, // available: 35, requested: 5
                    { productId: prod2Id, quantity: 50 } // available: 10, requested: 50 => FAILS
                ]
            });
        const atomicDraftId = draftRes.body.data.id;

        const confirmRes = await request(app)
            .post(`/api/challans/${atomicDraftId}/confirm`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();
        
        expect(confirmRes.status).toBe(400);

        // check first product stock is unchanged
        const checkProdRes = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(checkProdRes.body.data.currentStock).toBe(35); // unchanged
    });

    // 12. Unauthorized role cannot access restricted API
    it('should prevent unauthorized role from accessing restricted API', async () => {
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${warehouseToken}`)
            .send({
                customerName: 'Warehouse Customer',
                mobileNumber: '8888888888',
                businessName: 'Warehouse Business',
                customerType: 'RETAIL',
                address: '123 Warehouse St'
            });
        expect(res.status).toBe(403);
    });

    // 13. Product snapshot is stored correctly
    it('should store product snapshot correctly in challan items', async () => {
        const challanRes = await request(app)
            .get(`/api/challans/${draftChallanId}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
        const item = challanRes.body.data.items[0];
        expect(item.productNameSnapshot).toBe('Test Product');
        expect(Number(item.unitPriceSnapshot)).toBe(100);
        expect(item.quantity).toBe(5);
        expect(Number(item.totalPrice)).toBe(500);
    });

});
