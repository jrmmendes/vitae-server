import { Document } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class ActivationToken extends Document {
  @Prop()
  value: string;

  @Prop({ default: false })
  hasBeenUsed?: boolean;

  @Prop()
  userId: string;
}

export const ActivationTokenSchema = SchemaFactory
  .createForClass(ActivationToken);
