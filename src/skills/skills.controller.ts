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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { UpdatePermissionDto } from 'src/permissions/dto/update-permission.dto';
import { GetSkillByNameDto } from './dto/get-skill-by-name.dto';

@Controller('skills')
@ApiTags('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @SkipCheckPermission()
  @Post()
  @ResponseMessage('Create a new skill')
  create(@Body() createSkillDto: CreateSkillDto, @User() user: IUser) {
    return this.skillsService.create(createSkillDto, user);
  }

  @Public()
  @Get()
  @ResponseMessage('Fetch all skills with pagination')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.skillsService.findAll(+currentPage, +limit, qs);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch a skill by id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update a skill')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @User() user: IUser,
  ) {
    return this.skillsService.update(id, updateSkillDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Remove a skill')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.skillsService.remove(id, user);
  }

  @Public()
  @Post('get-by-name')
  @ResponseMessage('Fetch a skill by id')
  findOneByName(@Body() dto: GetSkillByNameDto) {
    return this.skillsService.findOneByName(dto);
  }

  @Public()
  @Post('list')
  @ResponseMessage('Fetch all skills following id-name')
  findAllSelectName() {
    return this.skillsService.findAllSelectName();
  }
}
