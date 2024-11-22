import { Controller, Get } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailService } from './mail.service';
@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @ResponseMessage('Send a new-job email')
  @Cron('0 0 7 * * 0') // Every Sun, 7h:0m:0s
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleSendMail() {
    this.mailService.sendJobsToSubs();
  }
}
