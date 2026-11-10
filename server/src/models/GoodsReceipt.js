import mongoose from 'mongoose';

const goodsReceiptSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    referenceNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    receiptDate: {
      type: Date,
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ product: 1 });
goodsReceiptSchema.index({ supplier: 1 });
goodsReceiptSchema.index({ receiptDate: -1 });
goodsReceiptSchema.index({ createdAt: -1 });

const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);
export default GoodsReceipt;
