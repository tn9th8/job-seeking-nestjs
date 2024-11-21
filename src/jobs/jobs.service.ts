import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { Job, JobDocument } from './schemas/job.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { UserDocument, User as UserModel } from 'src/users/schemas/user.schema';
import { SkillsModule } from 'src/skills/skills.module';
import { Skill, SkillDocument } from 'src/skills/schemas/skill.schema';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) // connect shema of mongo
    private jobModel: SoftDeleteModel<JobDocument>, //private userModel: Model<Company>,

    @InjectModel(UserModel.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Skill.name)
    private skillModel: SoftDeleteModel<SkillDocument>,
  ) { }

  async create(createJobDto: CreateJobDto, @User() userReq: IUser) {
    const skills: string[] = await Promise.all(createJobDto.skills.map(async skill => {
      const found = await this.skillModel.findById(skill);
      return found.name;
    }))

    let newJob = await this.jobModel.create({
      ...createJobDto,
      skills,
      createdBy: {
        _id: userReq._id,
        email: userReq.email,
      },
    });
    return newJob;
  }

  async findAll(
    currentPage: number,
    limit: number,
    qs: string,
    skills?: string[],
    company?: string,
  ) {
    // giải mã query string, chuẩn bị các biến phân trang
    let { filter, sort } = aqp(qs);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;
    delete filter.current;
    delete filter.pageSize;
    if (!sort) {
      sort = { updatedAt: -1 };
    }

    // tạo mongoose có signature để convert string to obj id
    const mongoose = require('mongoose');
    // chuẩn bị câu query tìm jobs mà matching với skills do client truyền
    let jobsMatchingSkills = {};
    if (skills) {
      const skillsObjId = skills.map((item: string) => {
        return new mongoose.Types.ObjectId(item);
      });
      jobsMatchingSkills = { skills: { $in: skillsObjId } };
    }
    // chuẩn bị câu query tìm jobs mà matching với company do client truyền
    let jobsMatchingCompanies = {};
    if (company) {
      const companiesObjId = [];
      companiesObjId.push(new mongoose.Types.ObjectId(company));
      jobsMatchingCompanies = { 'company._id': { $in: companiesObjId } };
    }

    // model thực hiện đọc jobs data
    let result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      //.skip(offset)
      //.limit(defaultLimit)
      .sort(sort as any)
      .exec();

    // paginate
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .exec();
    // return
    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }

  async findOne(_id: string) {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return 'Not found job';
    }
    return await this.jobModel
      .findById(_id)
      .populate({ path: 'company', select: { _id: 1, name: 1, logo: 1 } });
  }

  async update(id: string, updateJobDto: UpdateJobDto, userReq: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`not found job with id=${id}`); // status: 200 => 400
    }
    return await this.jobModel.updateOne(
      { _id: id },
      {
        ...updateJobDto,
        updatedBy: {
          _id: userReq._id,
          email: userReq.email,
        },
      },
    );
  }

  async remove(_id: string, userReq: IUser) {
    // Cách 1 validate:
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return 'Not found user';
    }

    await this.jobModel.updateOne(
      { _id },
      {
        deletedBy: {
          _id: userReq._id,
          email: userReq.email,
        },
      },
    );
    return this.jobModel.softDelete({ _id });
  }

  async countJobsHiring() {
    const today: Date = new Date();

    // query: endDate >= today
    const result = await this.jobModel
      .find({ endDate: { $gte: today } })
      .select({ endDate: 1 })
      .exec();

    return {
      message: 'Việc làm đang tuyển',
      number: (result).length,
      today: today,
    };
  }

  async countJobsToday() {
    let today: Date = new Date();
    today.setHours(0, 0, 0, 0); // bị trừ 1 ngày
    const todayTimestamp = today.getTime() + 24 * 60 * 60 * 1000; // cộng thêm 1 ngày
    today = new Date(todayTimestamp);

    const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;
    const tomorrow: Date = new Date(tomorrowTimestamp);

    // query: startDate >= today & startDate < tomorrow
    const result = await this.jobModel
      .find({ startDate: { $gte: today, $lt: tomorrow } })
      .select({ startDate: 1 })
      .exec();

    return {
      message: 'Việc làm mới hôm nay',
      number: (result).length,
      today: today,
    };
  }

  async findJobsMatchingSkill(skill: any) {
    const jobMatchingSkills = await this.jobModel.find({
      skills: { $in: skill.name },
    });
    return jobMatchingSkills.length;
  }

  async findAllByManager(
    currentPage: number,
    limit: number,
    qs: string,
    user: IUser,
    skills?: string[],
    company?: string,
  ) {
    // giải mã query string, chuẩn bị các biến phân trang
    let { filter, sort } = aqp(qs);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;
    delete filter.current;
    delete filter.pageSize;
    if (!sort) {
      sort = { updatedAt: -1 };
    }

    // tạo mongoose có signature để convert string to obj id
    const mongoose = require('mongoose');

    // chuẩn bị câu query tìm jobs mà matching với skills do client truyền
    let jobsMatchingSkills = {};
    if (skills) {
      const skillsObjId = skills.map((item: string) => {
        return new mongoose.Types.ObjectId(item);
      });
      jobsMatchingSkills = { skills: { $in: skillsObjId } };
    }

    // chuẩn bị câu query tìm jobs mà matching với company do client truyền
    let jobsMatchingCompanies = {};
    if (company) {
      const companiesObjId = [];
      companiesObjId.push(new mongoose.Types.ObjectId(company));
      jobsMatchingCompanies = { 'company._id': { $in: companiesObjId } };
    }

    // model thực hiện đọc jobs data
    let result = null;
    let totalItems = null;
    let totalPages = null;
    const { name } = user.role;
    if (name.includes('HR')) {
      const hrUser = await this.userModel.findById(user._id);

      const companiesObjId = [];
      companiesObjId.push(new mongoose.Types.ObjectId(hrUser.company._id));
      jobsMatchingCompanies = { 'company._id': { $in: companiesObjId } };

      result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      //.skip(offset)
      //.limit(defaultLimit)
      .sort(sort as any)
      .exec();

    // paginate
    totalItems = result.length;
    totalPages = Math.ceil(totalItems / defaultLimit);
    result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .exec();
    }
    else {
      result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      //.skip(offset)
      //.limit(defaultLimit)
      .sort(sort as any)
      .exec();

    // paginate
    totalItems = result.length;
    totalPages = Math.ceil(totalItems / defaultLimit);
    result = await this.jobModel
      .aggregate([
        {
          // join bảng company
          $lookup: {
            from: 'companies', // schema
            localField: 'company',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, logo: 1 } }],
            as: 'company',
          },
        },
        // where query string, skills, company
        { $match: filter },
        { $match: jobsMatchingSkills },
        { $match: jobsMatchingCompanies },
        { $match: { isDeleted: false } },
        // select fields
        {
          $project: {
            _id: 1,
            name: 1,
            company: { $arrayElemAt: ['$company', 0] }, // convert array to one
            skills: 1,
            location: 1,
            salary: 1,
            quantity: 1,
            level: 1,
            description: 1,
            endDate: 1,
            startDate: 1,
            createdAt: 1,
            createdBy: 1,
            updatedAt: 1,
            updatedBy: 1,
            isDeleted: 1,
            deletedAt: 1,
            deletedBy: 1,
          },
        },
      ])
      // paginate và sort
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .exec();
    }

    // return
    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }
  async countJobsLevel(level: String) {
    let result = await this.jobModel.find({ level: { $eq: level } })
    return {
      position: `Vị trí ${level}`,
      value: (result).length
    }
  }
}
