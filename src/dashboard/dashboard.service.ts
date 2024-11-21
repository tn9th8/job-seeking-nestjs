import { Injectable } from '@nestjs/common';
import { JobsService } from 'src/jobs/jobs.service';
import { ResumesService } from 'src/resumes/resumes.service';
import { SkillsService } from 'src/skills/skills.service';

@Injectable()
export class DashboardService {
  constructor(
    private jobsService: JobsService,
    private skillsService: SkillsService,
    private resumesService: ResumesService,
  ) { }

  async countJobs() {
    const jobsHiring = await this.jobsService.countJobsHiring();
    const jobsToday = await this.jobsService.countJobsToday();
    const resumesMonth = await this.resumesService.countResumesMonth();
    return {
      jobsHiring,
      jobsToday,
      resumesMonth,
    };
  }

  async findTop5Skills() {
    const skills = await this.skillsService.findTop5Skills();
    return skills;
  }

  async countLevelJob() {
    return [
      await this.jobsService.countJobsLevel("INTERN"),
      await this.jobsService.countJobsLevel("FRESHER"),
      await this.jobsService.countJobsLevel("JUNIOR"),
      await this.jobsService.countJobsLevel("MIDDLE"),
      await this.jobsService.countJobsLevel("SENIOR"),
    ]
  }
}
