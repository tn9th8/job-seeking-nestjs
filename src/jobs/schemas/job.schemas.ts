import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Company } from 'src/companies/schemas/company.schema';
import { Skill } from 'src/skills/schemas/skill.schema';

export type JobDocument = HydratedDocument<Job>;

@Schema({ timestamps: true }) // biến class thành 1 schema // lấy time at
export class Job {
  @Prop()
  name: string;

  // @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: Skill.name })
  // skills: mongoose.Schema.Types.ObjectId[];
  @Prop({ type: [String], ref: Skill.name })
  skills: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Company.name })
  company: mongoose.Schema.Types.ObjectId;

  @Prop()
  location: string;

  @Prop()
  salary: number;

  @Prop()
  quantity: number; // quantity of recruits, opening

  @Prop()
  level: string;

  @Prop()
  description: string; // html

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  isActive: boolean;

  //

  @Prop({ type: Object })
  createdBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  updatedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
