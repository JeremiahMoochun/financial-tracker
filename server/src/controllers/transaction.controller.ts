import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const uid = req.user?.id;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    if (!reason || reason.trim().length < 5) {
      return res
        .status(400)
        .json({ message: 'Delete reason is required (min 5 characters)' });
    }

    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = tx.user.toString() === uid;

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to delete this transaction' });
    }

    if (tx.isDeleted) {
      return res.status(409).json({ message: 'Transaction already deleted' });
    }

    tx.isDeleted = true;
    tx.deletedAt = new Date();
    tx.deletedBy = new mongoose.Types.ObjectId(uid);
    tx.deleteReason = reason.trim();

    await tx.save();

    return res.status(200).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
};
