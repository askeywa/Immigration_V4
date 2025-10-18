import mongoose, { Document, Schema } from 'mongoose';

/**
 * Base interface for all models with common fields
 */
export interface IBaseModel extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Base schema with common fields for all models
 */
export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
};

/**
 * Soft delete plugin for Mongoose
 */
export const softDeletePlugin = (schema: Schema) => {
  schema.add({
    deletedAt: { type: Date, default: null }
  });

  schema.pre(/^find/, function(this: any, next) {
    if (!this.getQuery().deletedAt) {
      this.find({ deletedAt: null });
    }
    next();
  });

  schema.methods.softDelete = function() {
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function() {
    this.deletedAt = null;
    return this.save();
  };
};
