import express from "express";
import cors from "cors";

import argon2 from "argon2";
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  

const prisma = new PrismaClient({ adapter });


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Chronicle API");
});

app.get("/test", async (req, res) => {

    try {
        const user = await prisma.user.findUnique({
            where: {
              email: "paul@example.com",
            },
          });

          if (!user) {
            return res.status(401).json({
              message: "Invalid email or password",
            });
          }
      
          const passwordIsCorrect = await argon2.verify(
            user.passwordHash,
            password
          );
      
          if (!passwordIsCorrect) {
            return res.status(401).json({
              message: "Invalid email or password",
            });
          }
      
    
    
        res.send(user);
    } catch (error) {
        console.error("Login error:", error);
    
        return res.status(500).json({
          message: "Something went wrong",
        });
      }
    
});


export default app;