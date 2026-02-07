import mongoose from "mongoose";
import config from "../app/config";
import { Symbol } from "../app/modules/Symbol/symbol.model";
import { BINANCE_USDT_SYMBOLS } from "../app/utils/symbolsList";
import readline from "readline";

async function seedSymbols() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    console.log("✅ Connected to MongoDB");

    // Check if symbols already exist
    const existingCount = await Symbol.countDocuments();
    
    if (existingCount > 0) {
      console.log(`ℹ️ Database already has ${existingCount} symbols`);
      const answer = await new Promise<string>((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(
          "Do you want to clear existing symbols and reseed? (yes/no): ",
          (ans: string) => {
            rl.close();
            resolve(ans.toLowerCase());
          }
        );
      });

      if (answer === "yes" || answer === "y") {
        await Symbol.deleteMany({});
        console.log("🗑️ Cleared existing symbols");
      } else {
        console.log("❌ Seeding cancelled");
        process.exit(0);
      }
    }

    // Insert symbols
    console.log(`📊 Inserting ${BINANCE_USDT_SYMBOLS.length} symbols...`);
    
    const result = await Symbol.insertMany(BINANCE_USDT_SYMBOLS, {
      ordered: false,
    });

    console.log(`✅ Successfully seeded ${result.length} symbols`);
    console.log("\nSample symbols:");
    const samples = await Symbol.find().limit(10);
    samples.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.symbol} (${s.baseAsset}/${s.quoteAsset})`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding symbols:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedSymbols();
