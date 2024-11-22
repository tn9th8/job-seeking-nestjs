import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  Min,
  MinDate,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

// Data transfer object // class = {}
export class CreateJobDto {
  @IsNotEmpty({ message: 'name không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'skills không được để trống' })
  // @IsMongoId({ each: true, message: 'skills phải là mongo object id' })
  @IsArray({ message: 'skills có định dạng là array' })
  skills: mongoose.Schema.Types.ObjectId[] | string[];

  @IsNotEmpty({ message: 'company không được để trống' })
  @IsMongoId({ message: 'company có định dạng là mongo object id' })
  company: mongoose.Schema.Types.ObjectId;

  // @IsNotEmptyObject()
  // @IsObject()
  // @ValidateNested()
  // @Type(() => Company)
  // company: Company;

  @IsNotEmpty({ message: 'Location không được để trống' })
  location: string;

  @IsNotEmpty({ message: 'Salary không được để trống' })
  @Min(0) 
  salary: number;

  @IsNotEmpty({ message: 'Quantity không được để trống' })
  @Min(0) 
  quantity: number;

  @IsNotEmpty({ message: 'Level không được để trống' })
  level: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  description: string; //html

  @IsNotEmpty({ message: 'startDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'startDate có định dạng là Date' })
  @MinDate(new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'startDate không được nhỏ hơn ngày hiện tại',
  })
  startDate: Date;

  @IsNotEmpty({ message: 'endDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'endDate có định dạng là Date' })
  @MinDate(new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'endDate không được nhỏ hơn ngày hiện tại',
  })
  endDate: Date;

  @IsNotEmpty({ message: 'isActive không được để trống' })
  @IsBoolean({ message: 'isActive có định dạng là boolean' })
  isActive: boolean;

  // check endDate sau startDate ở đây hoặc trong service
}

// // Validate object prop
// class Company {
//   @IsNotEmpty()
//   _id: mongoose.Schema.Types.ObjectId;

//   @IsNotEmpty()
//   name: string;

//   @IsNotEmpty()
//   logo: string;
// }
