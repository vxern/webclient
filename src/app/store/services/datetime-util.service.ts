import { Injectable } from '@angular/core';
import { NgbDateStruct, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Injectable()
export class DateTimeUtilService {

  readonly ISO8601_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

  createDateTimeStrFromNgbDateTimeStruct(date: NgbDateStruct, time: NgbTimeStruct): string {
    return moment([date.year, date.month, date.day, time.hour, time.minute, time.second])
      .utc()
      .format(this.ISO8601_DATETIME_FORMAT);
  }

  createDateTimeFromNgbDateTimeStruct(date: NgbDateStruct, time: NgbTimeStruct): moment.Moment {
    return moment([date.year, date.month, date.day, time.hour, time.minute, time.second]).utc();
  }

}