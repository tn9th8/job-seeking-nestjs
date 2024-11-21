import {
  Controller,
  Get
} from '@nestjs/common';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Public()
  @Get('jobs')
  @ResponseMessage('Count Jobs')
  countJobs() {
    return this.dashboardService.countJobs();
  }

  @Public()
  @Get('skills')
  @ResponseMessage('Top 5 kỹ năng tuyển dụng nhiều nhất')
  findTop5Skills() {
    return this.dashboardService.findTop5Skills();
  }

  @Public()
  @Get('levels')
  @ResponseMessage('Số lượng các vị trí tuyển dụng')
  findLevels() {
    return this.dashboardService.countLevelJob();
  }
}
