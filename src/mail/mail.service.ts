import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { CompaniesService } from 'src/companies/companies.service';
import { Company } from 'src/companies/schemas/company.schema';
import { Job, JobDocument } from 'src/jobs/schemas/job.schemas';
import {
  Subscriber,
  SubscriberDocument,
} from 'src/subscribers/schemas/subscriber.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>,

    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<JobDocument>,

    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    private companiesService: CompaniesService,
  ) {}

  async sendJobsToSubs() {
    // find all subcribers
    const subscribers = await this.subscriberModel.find().populate([{path: 'user'}, {path: 'skills'}]);
    // send mail for each subcribers
    for (const subs of subscribers) {
      // find job có chứa subcribers's skills
      const subsSkills = subs.skills.map(skill => (skill as any).name);
      
      const jobWithMatchingSkills = await this.jobModel.find({
        skills: { $in: subsSkills },
      });
      if (jobWithMatchingSkills?.length) {
        // định dạng dữ liệu job trước khi gửi
        const jobs = jobWithMatchingSkills.map((item: any) => {
          const company : any = this.companiesService.findOne(item.company)
          return {
            name: item.name,
            company: company.name,
            salary: `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ',
            // skills: item.skills,
          };
        });
        // từ sub => tìm user
        const user = await this.userModel.findById(subs.user);
        // gửi mail
        await this.mailerService.sendMail({
          to: (subs.user as any).email,
          from: '"Support Team" <support@example.com>', // override default from
          subject: 'Welcome to Nice App! Confirm your Email',
          template: 'new-job', // HTML body content
          context: {
            receiver: user.name,
            jobs: jobs,
          },
        });
      }
    }
  }

  async sendNewPassword(user: any, newPass: string) {
    // gửi mail
    await this.mailerService.sendMail({
      to: `${user.email}`,
      from: '"IT job" <support@itjob.com>', // override default from
      subject: 'You have been issued a new password',
      template: 'new-password', // HTML body content
      context: {
        receiver: user.name,
        newPass: newPass,
      },
    });
  }
}
