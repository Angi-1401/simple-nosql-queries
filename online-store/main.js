import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function main() {
  try {
    // Connect to server
    await client.connect();
    console.log("Connection established successfully");

    // Assign database and collections to usable variables
    const db = client.db("onlineStore");
    const products = db.collection("products");
    const users = db.collection("users");

    // Insert one product
    await products.insertOne({
      name: "Laptop",
      brand: "DELL",
      price: 1200,
      stock: 10,
    });

    // Insert multiple products
    await products.insertMany([
      { name: "Mouse", brand: "Logitech", price: 15, stock: 22 },
      { name: "Keyboard", brand: "Redragon", price: 90, stock: 9 },
      { name: "Monitor", brand: "Samsung", price: 230, stock: 7 },
    ]);

    // Insert multiple users
    await users.insertMany([
      { name: "John Doe", email: "H9l5e@example.com", age: 25, orders: [] },
      {
        name: "Alice Smith",
        email: "UO3L2@example.com",
        age: 42,
        orders: [],
      },
      {
        name: "Petter Brown",
        email: "W7eMl@example.com",
        age: 37,
        orders: [],
      },
    ]);

    // Find all products
    const allProducts = await products.find({}).toArray();
    console.log("All products:", allProducts);

    // Find all products and sort them by price
    console.log(
      "All products (sorted by price):",
      await products.find({}).sort({ price: 1 }).toArray()
    );

    // Find products with price grater than 1000
    const expensiveProducts = await products
      .find({ price: { $gte: 1000 } })
      .toArray();
    console.log("Expensive products:", expensiveProducts);

    // Find products with price between 500 and 1500
    const productsBetweenPrices = await products
      .find({ price: { $gte: 500, $lte: 1500 } })
      .toArray();
    console.log("Products between prices:", productsBetweenPrices);

    // Count all products
    console.log("All products (count):", await products.countDocuments({}));

    // Decrease the stock of a product
    await products.updateOne(
      { name: "Laptop", brand: "DELL", price: 1200 },
      { $set: { stock: 5 } }
    );

    // Increase the price of all products by 10%
    await products.updateMany({}, { $mul: { price: 1.1 } });

    // Delete a product
    await products.deleteOne({ name: "Laptop" });

    // Delete all products with stock 0
    await products.deleteMany({ stock: 0 });

    // Add an order to a user
    await users.updateOne(
      { name: "John Doe" },
      {
        $push: {
          orders: {
            productId: new ObjectId(allProducts[1]._id),
            quantity: 2,
            unitPrice: allProducts[1].price,
          },
        },
      }
    );

    // Calculate the average price of all products
    const averagePrice = await products
      .aggregate([{ $group: { _id: null, averagePrice: { $avg: "$price" } } }])
      .toArray();
    console.log("Average price:", averagePrice[0].averagePrice);

    // Relate users with orders
    const usersWithOrders = await users
      .aggregate([
        {
          $lookup: {
            from: "products",
            localField: "orders.productId",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
      ])
      .toArray();
      console.log("Users with orders:");
      console.dir(usersWithOrders, { depth: null });

    // Find all users with more than one product in their orders
    const usersWithMultipleOrders = await users
      .aggregate([
        {
          $lookup: {
            from: "products",
            localField: "orders.id",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        { $match: { "orderDetails.price": { $exists: true } } },
        {
          $group: {
            _id: "$name",
            ordersCount: { $sum: 1 },
          },
        },
        { $match: { ordersCount: { $gt: 1 } } },
      ])
      .toArray();
    console.log("Users with multiple orders:", usersWithMultipleOrders);

    // Retrieve all products with only its name and price
    const simpleProducts = await products
      .aggregate([{ $project: { name: 1, price: 1 } }])
      .toArray();
    console.log("Simple products:", simpleProducts);

    // Breakdown orders in users to show every ordered product in a separated document
    const detailedOrders = await users
      .aggregate([{ $unwind: "$orders" }])
      .toArray();
    console.log("Detailed orders:", detailedOrders);
  } catch (error) {
    console.error("There was an error:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

main();
