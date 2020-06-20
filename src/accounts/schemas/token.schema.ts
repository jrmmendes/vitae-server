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
}

export const ActivationTokenSchema = SchemaFactory
  .createForClass(ActivationToken);
