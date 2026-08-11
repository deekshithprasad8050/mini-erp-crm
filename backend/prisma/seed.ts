import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean existing data
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', passwordHash, role: Role.ADMIN },
  });
  const sales = await prisma.user.create({
    data: { name: 'Sales User', email: 'sales@example.com', passwordHash, role: Role.SALES },
  });
  const warehouse = await prisma.user.create({
    data: { name: 'Warehouse User', email: 'warehouse@example.com', passwordHash, role: Role.WAREHOUSE },
  });
  const accounts = await prisma.user.create({
    data: { name: 'Accounts User', email: 'accounts@example.com', passwordHash, role: Role.ACCOUNTS },
  });

  // Create Customers
  const customersData = [
    { customerName: 'Ramesh Patel', mobileNumber: '9876543210', email: 'ramesh@abctraders.com', businessName: 'ABC Traders', gstNumber: '22AAAAA0000A1Z5', customerType: CustomerType.WHOLESALE, address: '123 Market St, Mumbai', status: CustomerStatus.ACTIVE },
    { customerName: 'Suresh Kumar', mobileNumber: '9876543211', email: 'suresh@srilakshmi.com', businessName: 'Sri Lakshmi Distributors', gstNumber: '22BBBBB0000B1Z5', customerType: CustomerType.DISTRIBUTOR, address: '45 Industrial Area, Bangalore', status: CustomerStatus.ACTIVE },
    { customerName: 'Mohan Sharma', mobileNumber: '9876543212', email: 'mohan@retail.com', businessName: 'Mohan Retailers', gstNumber: '22CCCCC0000C1Z5', customerType: CustomerType.RETAIL, address: '78 High Street, Delhi', status: CustomerStatus.LEAD },
    { customerName: 'Balaji Rao', mobileNumber: '9876543213', email: 'balaji@enterprises.com', businessName: 'Balaji Enterprises', gstNumber: '22DDDDD0000D1Z5', customerType: CustomerType.WHOLESALE, address: '90 Trading Post, Chennai', status: CustomerStatus.INACTIVE },
    { customerName: 'Kishore Singh', mobileNumber: '9876543214', businessName: 'Kishore Mart', customerType: CustomerType.RETAIL, address: '12 Local Road, Pune', status: CustomerStatus.LEAD },
    { customerName: 'Anita Desai', mobileNumber: '9876543215', email: 'anita@desaitraders.com', businessName: 'Desai Traders', gstNumber: '22EEEEE0000E1Z5', customerType: CustomerType.WHOLESALE, address: '34 Commercial St, Ahmedabad', status: CustomerStatus.ACTIVE },
    { customerName: 'Rajeev Verma', mobileNumber: '9876543216', businessName: 'Verma Brothers', customerType: CustomerType.DISTRIBUTOR, address: '56 Transport Nagar, Jaipur', status: CustomerStatus.ACTIVE },
    { customerName: 'Priya Reddy', mobileNumber: '9876543217', email: 'priya@reddyretail.com', businessName: 'Reddy Retail', gstNumber: '22FFFFF0000F1Z5', customerType: CustomerType.RETAIL, address: '78 Shop Lane, Hyderabad', status: CustomerStatus.ACTIVE },
    { customerName: 'Amit Gupta', mobileNumber: '9876543218', businessName: 'Gupta Suppliers', customerType: CustomerType.WHOLESALE, address: '90 Wholesale Market, Lucknow', status: CustomerStatus.ACTIVE },
    { customerName: 'Neha Joshi', mobileNumber: '9876543219', email: 'neha@joshient.com', businessName: 'Joshi Enterprises', gstNumber: '22GGGGG0000G1Z5', customerType: CustomerType.WHOLESALE, address: '12 Business Park, Indore', status: CustomerStatus.LEAD }
  ];

  const customers = await Promise.all(customersData.map(c => prisma.customer.create({ data: c })));

  // Create Products
  const productsData = [
    { productName: 'Smart TV 55"', sku: 'ELEC-TV-001', category: 'Electronics', unitPrice: 35000, currentStock: 50, minimumStock: 10, warehouseLocation: 'A1-R1' },
    { productName: 'Laptop Pro 15"', sku: 'ELEC-LAP-001', category: 'Electronics', unitPrice: 65000, currentStock: 30, minimumStock: 5, warehouseLocation: 'A1-R2' },
    { productName: 'Cotton Bedsheet Set', sku: 'TEX-BED-001', category: 'Textiles', unitPrice: 1500, currentStock: 200, minimumStock: 50, warehouseLocation: 'B2-R1' },
    { productName: 'Silk Saree', sku: 'TEX-SAR-001', category: 'Textiles', unitPrice: 5000, currentStock: 100, minimumStock: 20, warehouseLocation: 'B2-R2' },
    { productName: 'Premium Rice 5kg', sku: 'FMCG-RIC-001', category: 'FMCG', unitPrice: 450, currentStock: 500, minimumStock: 100, warehouseLocation: 'C3-R1' },
    { isValid: true, productName: 'Cooking Oil 1L', sku: 'FMCG-OIL-001', category: 'FMCG', unitPrice: 180, currentStock: 1000, minimumStock: 200, warehouseLocation: 'C3-R2' },
    { productName: 'Hammer Standard', sku: 'HDW-HAM-001', category: 'Hardware', unitPrice: 300, currentStock: 150, minimumStock: 30, warehouseLocation: 'D4-R1' },
    { productName: 'Power Drill 500W', sku: 'HDW-DRL-001', category: 'Hardware', unitPrice: 2500, currentStock: 40, minimumStock: 10, warehouseLocation: 'D4-R2' },
    { productName: 'A4 Paper Ream', sku: 'STN-PAP-001', category: 'Stationery', unitPrice: 200, currentStock: 400, minimumStock: 100, warehouseLocation: 'E5-R1' },
    { productName: 'Ballpoint Pen Box (50)', sku: 'STN-PEN-001', category: 'Stationery', unitPrice: 150, currentStock: 300, minimumStock: 50, warehouseLocation: 'E5-R2' },
    { productName: 'Bluetooth Speaker', sku: 'ELEC-SPK-001', category: 'Electronics', unitPrice: 2000, currentStock: 80, minimumStock: 15, warehouseLocation: 'A1-R3' },
    { productName: 'Denim Jeans Men', sku: 'TEX-JNS-001', category: 'Textiles', unitPrice: 1200, currentStock: 150, minimumStock: 30, warehouseLocation: 'B2-R3' },
    { productName: 'Washing Powder 3kg', sku: 'FMCG-WSH-001', category: 'FMCG', unitPrice: 350, currentStock: 400, minimumStock: 80, warehouseLocation: 'C3-R3' },
    { productName: 'Screwdriver Set (10)', sku: 'HDW-SCR-001', category: 'Hardware', unitPrice: 400, currentStock: 120, minimumStock: 20, warehouseLocation: 'D4-R3' },
    { productName: 'Notebook Spiral', sku: 'STN-NBK-001', category: 'Stationery', unitPrice: 60, currentStock: 500, minimumStock: 100, warehouseLocation: 'E5-R3' }
  ].map(p => {
    const { isValid, ...rest } = p as any;
    return rest;
  });

  const products = await Promise.all(productsData.map(p => prisma.product.create({ data: p })));

  // Add stock IN movements
  for (const product of products) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantityChanged: product.currentStock,
        movementType: MovementType.IN,
        reason: 'Initial Stock',
        createdBy: admin.id
      }
    });
  }

  // Create FollowUps
  await prisma.customerFollowUp.create({
    data: {
      customerId: customers[0].id,
      note: 'Called to discuss new prices, interested in bulk order.',
      followUpDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      createdBy: sales.id
    }
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customers[2].id,
      note: 'Sent product catalog.',
      followUpDate: new Date(Date.now() + 86400000 * 5),
      createdBy: sales.id
    }
  });

  // Create Challans
  // 1. Draft Challan
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-000001',
      customerId: customers[0].id,
      status: ChallanStatus.DRAFT,
      totalQuantity: 15,
      createdBy: sales.id,
      items: {
        create: [
          {
            productId: products[0].id, // TV
            productNameSnapshot: products[0].productName,
            skuSnapshot: products[0].sku,
            unitPriceSnapshot: products[0].unitPrice,
            quantity: 5,
            totalPrice: 5 * Number(products[0].unitPrice)
          },
          {
            productId: products[1].id, // Laptop
            productNameSnapshot: products[1].productName,
            skuSnapshot: products[1].sku,
            unitPriceSnapshot: products[1].unitPrice,
            quantity: 10,
            totalPrice: 10 * Number(products[1].unitPrice)
          }
        ]
      }
    }
  });

  // 2. Confirmed Challan
  const confirmedChallan = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-000002',
      customerId: customers[1].id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 200,
      createdBy: admin.id,
      items: {
        create: [
          {
            productId: products[4].id, // Rice
            productNameSnapshot: products[4].productName,
            skuSnapshot: products[4].sku,
            unitPriceSnapshot: products[4].unitPrice,
            quantity: 100,
            totalPrice: 100 * Number(products[4].unitPrice)
          },
          {
            productId: products[5].id, // Oil
            productNameSnapshot: products[5].productName,
            skuSnapshot: products[5].sku,
            unitPriceSnapshot: products[5].unitPrice,
            quantity: 100,
            totalPrice: 100 * Number(products[5].unitPrice)
          }
        ]
      }
    }
  });

  // Create corresponding OUT movements for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: products[4].id,
      quantityChanged: 100,
      movementType: MovementType.OUT,
      reason: `Sales Challan CH-2026-000002`,
      createdBy: admin.id
    }
  });
  
  await prisma.product.update({
    where: { id: products[4].id },
    data: { currentStock: { decrement: 100 } }
  });

  await prisma.stockMovement.create({
    data: {
      productId: products[5].id,
      quantityChanged: 100,
      movementType: MovementType.OUT,
      reason: `Sales Challan CH-2026-000002`,
      createdBy: admin.id
    }
  });

  await prisma.product.update({
    where: { id: products[5].id },
    data: { currentStock: { decrement: 100 } }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
