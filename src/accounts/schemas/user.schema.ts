import { Document } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  id: true,
  _id: false,
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
