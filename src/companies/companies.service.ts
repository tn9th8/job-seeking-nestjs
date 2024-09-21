import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import mongoose, { Model } from 'mongoose';
import { IUser } from 'src/users/users.interface';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';
import { UserDocument, User as UserModel } from 'src/users/schemas/user.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) // connect shema of mongo
    private companyModel: SoftDeleteModel<CompanyDocument>, //private userModel: Model<Company>,

    @InjectModel(UserModel.name)
    private userModel: SoftDeleteModel<UserDocument>,
  ) { }

  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
    // ... mean is that copying all data of createCompanyDto to insert 1 document at database
    return await this.companyModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    // console.log("🚀 ~ CompaniesService ~ findAll ~ qs:", qs)
    delete filter.current;
    delete filter.pageSize;
    delete filter.name;
    // return { filter }; // check filter thấy dự page và limit nên phải xóa
    // { projection, population } để join bảng
    // regular expression:
    // - filter của thư viện sẽ biểu = thành eq của mongoDB
    // - LIKE operator on mongoose: /pattern/i

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    // count all documents theo điều kiện filter
    // chia và làm tròn ra tổng số trang
    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    // sort(sort) có bug
    // vì 2 package mongoose và api-query-param bị bênh / lỗi
    // vì TS và JS bị mẫu thuẫn type do TS check type

    // Cách 1 fix: ý là code mình đã chắc đúng, bảo TS ko check type nữa
    // @ts-ignore: Unreachable code error

    // Cách 2 fix: dùng any everywhere => ép kiểu về phía bên phải
    // .sort(sort as any)

    // Cách 3 fix: dùng any => convert types of destructuring object in TS
    // let {sort}: {sort: any} = aqp(sq) // khai báo biến và ép kiểu bên cạch
    // let { sort }= <{sort: any}>aqp(rq);
    // xử lý admin vs HR

    const result = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

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

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`not found company with id=${id}`); // status: 200 => 400
    }

    return await this.companyModel.findById(id);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    // check id hop le
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`not found company with id=${id}`); // status: 200 => 400
    }

    return await this.companyModel.updateOne(
      { _id: id },
      {
        ...updateCompanyDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    // Cách 1 validate:
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found company';
    }

    // // Cách 2 validate:
    // // hàm này đã nằm trong softDelete
    // // hàm find thuộc soft-delete-plugin
    // const templates = await this.find({ _id: id });
    // if (!templates) {
    //   return Error('Element not found');
    // }

    // Cách 1 delete:
    // hàm softDelete có hạn chế không hỗ trợ lưu trường detetedBy
    // nên dùng hàm updateOne ở trên để hổ trợ
    await this.companyModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.companyModel.softDelete({ _id: id });

    // // Cách 2 delete:
    // // +: dùng 1 câu query
    // // -: frontend khó xử lý
    // await this.companyModel.updateOne(
    //   { _id: id },
    //   {
    //     detetedBy: {
    //       _id: user._id,
    //       email: user.email,
    //     },
    //     isDeleted: true,
    //     deletedAt: new Date(),
    //   },
    // );
  }

  async findAllByManager(
    currentPage: number,
    limit: number,
    qs: string,
    user: IUser,
  ) {
    const { filter, sort, population } = aqp(qs);
    // console.log("🚀 ~ CompaniesService ~ findAll ~ qs:", qs)
    delete filter.current;
    delete filter.pageSize;
    delete filter.name;
    // return { filter }; // check filter thấy dự page và limit nên phải xóa
    // { projection, population } để join bảng
    // regular expression:
    // - filter của thư viện sẽ biểu = thành eq của mongoDB
    // - LIKE operator on mongoose: /pattern/i

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    // count all documents theo điều kiện filter
    // chia và làm tròn ra tổng số trang
    let totalItems = (await this.companyModel.find(filter)).length;
    let totalPages = Math.ceil(totalItems / defaultLimit);

    // sort(sort) có bug
    // vì 2 package mongoose và api-query-param bị bênh / lỗi
    // vì TS và JS bị mẫu thuẫn type do TS check type

    // Cách 1 fix: ý là code mình đã chắc đúng, bảo TS ko check type nữa
    // @ts-ignore: Unreachable code error

    // Cách 2 fix: dùng any everywhere => ép kiểu về phía bên phải
    // .sort(sort as any)

    // Cách 3 fix: dùng any => convert types of destructuring object in TS
    // let {sort}: {sort: any} = aqp(sq) // khai báo biến và ép kiểu bên cạch
    // let { sort }= <{sort: any}>aqp(rq);
    // xử lý admin vs HR
    const { name } = user.role;
    let _id = null;
    let result = null;
    if (name.includes('HR')) {
      // for HR
      const hrUser = await this.userModel.findById(user._id);

      result = await this.companyModel
        .find(filter)
        .find({ _id: (await hrUser).company._id })
        // .skip(offset)
        // .limit(defaultLimit)
        .sort(sort as any)
        .populate(population)
        .exec();
      totalItems = result.length;
      totalPages = Math.ceil(totalItems / defaultLimit);
      result = await this.companyModel
        .find(filter)
        .find({ _id: (await hrUser).company._id })
        .skip(offset)
        .limit(defaultLimit)
        .sort(sort as any)
        .populate(population)
        .exec();
    } else {
      result = await this.companyModel
        .find(filter)
        // .skip(offset)
        // .limit(defaultLimit)
        .sort(sort as any)
        .populate(population)
        .exec();
      totalItems = result.length;
      totalPages = Math.ceil(totalItems / defaultLimit);
      result = await this.companyModel
        .find(filter)
        .skip(offset)
        .limit(defaultLimit)
        .sort(sort as any)
        .populate(population)
        .exec();
    }

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
}
