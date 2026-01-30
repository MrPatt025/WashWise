import { z } from "zod";

// ============================================
// Transaction Schemas
// ============================================

export const PaymentStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED"]);

export const TransactionSchema = z.object({
    id: z.string().uuid(),
    amount: z.number().int(), // minor units (satang/cents)
    status: PaymentStatusSchema,
    userId: z.string().uuid().nullable().optional(),
    machineId: z.string().uuid(),
    createdAt: z.date(),
});

export const CreateTransactionSchema = z.object({
    amount: z.number().int().positive(),
    machineId: z.string().uuid(),
    userId: z.string().uuid().optional(),
});

export const UpdateTransactionSchema = z.object({
    status: PaymentStatusSchema,
});

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
