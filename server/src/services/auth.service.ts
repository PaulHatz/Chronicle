import argon2 from "argon2";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  

const prisma = new PrismaClient({ adapter });

export async function loginUser(email: string, password: string) {
    
    const hash = await argon2.hash(password, {
        type: argon2.argon2i,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
    });

    
   // console.log(await argon2.verify(hash, password)); // true

    console.log(hash);
    
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return {success: 0 };
    }

    const valid = await argon2.verify(
        user.passwordHash,
        password
    );

    if (!valid) {
        return {
            success: 0
        };
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "7d"
        }
    );

    return { 
        user: user,
        token: token,
        success: 1
    };
}

export async function getCurrentUser(userId: number) {
    return prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
        }
    });
}
