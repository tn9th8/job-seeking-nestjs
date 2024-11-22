import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Post()
  @ResponseMessage('Create a new job')
  async create(@Body() createJobDto: CreateJobDto, @User() userReq: IUser) {
    return this.jobsService.create(createJobDto, userReq);
  }

  @Get()
  @Public()
  @ResponseMessage('Fetch jobs with pagination')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
    @Body('skills') skills?: string[],
    @Body('company') company?: string,
  ) {
    return this.jobsService.findAll(+currentPage, +limit, qs, skills, company);
  }
  @Post('/new')
  @Public()
  @ResponseMessage('Fetch jobs with pagination')
  findAllPost(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
    @Body('skills') skills?: string[],
    @Body('company') company?: string,
    @Body('location') locations?: string[],
  ) {
    return this.jobsService.findAll(+currentPage, +limit, qs, skills, company, locations);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Fetch a job by id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @SkipCheckPermission()
  @Patch(':id')
  @ResponseMessage('Update a job by id')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() userReq: IUser,
  ) {
    return this.jobsService.update(id, updateJobDto, userReq);
  }

  @Delete(':id')
  @ResponseMessage('Delete a job by id')
  remove(@Param('id') id: string, @User() userReq: IUser) {
    return this.jobsService.remove(id, userReq);
  }

  @Post('/manager')
  @ResponseMessage('Fetch jobs with pagination by manager')
  findAllByManager(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
    @User() user: IUser,
    @Body('skills') skills?: string[],
    @Body('company') company?: string,
  ) {
    return this.jobsService.findAllByManager(+currentPage, +limit, qs, user, skills, company);
  }
  
  
}
