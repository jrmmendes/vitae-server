import { Document } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class User extends Document {
  @Prop()
  name: string;
  
  @Prop()
  email: string;
  
  @Prop()
  passwordHash?: string;
  
  @Prop()
  isActive?: boolean;
}

export const UserSchema = SchemaFactory
  .createForClass(User);
