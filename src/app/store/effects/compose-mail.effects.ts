import { HttpEventType, HttpResponse } from '@angular/common/http';
// Angular
import { Injectable } from '@angular/core';
// Ngrx
import { Actions, Effect } from '@ngrx/effects';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
// Rxjs
import { Observable } from 'rxjs/Observable';
import { catchError, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
// Services
import { MailService } from '../../store/services';
// Custom Actions
import {
  ComposeMailActionTypes,
  CreateMail,
  CreateMailSuccess,
  DeleteAttachment,
  DeleteAttachmentSuccess,
  GetUsersKeys,
  GetUsersKeysSuccess,
  SendMail,
  SendMailSuccess,
  SnackErrorPush,
  SnackPush,
  UpdateCurrentFolder,
  UploadAttachment,
  UploadAttachmentProgress,
  UploadAttachmentRequest,
  UploadAttachmentSuccess
} from '../actions';
import { Draft } from '../datatypes';
import { MailFolderType } from '../models';

@Injectable()
export class ComposeMailEffects {

  constructor(private actions: Actions,
              private mailService: MailService) {
  }

  @Effect()
  createMailEffect: Observable<any> = this.actions
    .ofType(ComposeMailActionTypes.CREATE_MAIL)
    .map((action: CreateMail) => action.payload)
    .mergeMap(payload => {
      return this.mailService.createMail(payload.draft)
        .pipe(
          switchMap(res => {
            return [
              new CreateMailSuccess({draft: payload, response: res}),
              new UpdateCurrentFolder(res)
            ];
          }),
          catchError(err => [new SnackErrorPush({message: 'Failed to save mail.'})])
        );
    });

  @Effect()
  uploadAttachmentEffect: Observable<any> = this.actions
    .ofType(ComposeMailActionTypes.UPLOAD_ATTACHMENT)
    .map((action: UploadAttachment) => action.payload)
    .mergeMap(payload => {
      // TODO: replace custom observable with switchMap
      return Observable.create(observer => {
        const request: Subscription = this.mailService.uploadFile(payload)
          .finally(() => observer.complete())
          .subscribe((event: any) => {
              if (event.type === HttpEventType.UploadProgress) {
                const progress = Math.round(100 * event.loaded / event.total);
                observer.next(new UploadAttachmentProgress({...payload, progress}));
              } else if (event instanceof HttpResponse) {
                observer.next(new UploadAttachmentSuccess({data: payload, response: event.body}));
              }
            },
            err => observer.next(new SnackErrorPush({message: 'Failed to upload attachment.'})));
        observer.next(new UploadAttachmentRequest({...payload, request}));
      });
    });

  @Effect()
  deleteAttachmentEffect: Observable<any> = this.actions
    .ofType(ComposeMailActionTypes.DELETE_ATTACHMENT)
    .map((action: DeleteAttachment) => action.payload)
    .mergeMap(payload => {
      if (payload.id) {
        return this.mailService.deleteAttachment(payload)
          .pipe(
            switchMap(res => {
              return [new DeleteAttachmentSuccess(payload)];
            }),
            catchError(err => [new SnackErrorPush({message: 'Failed to delete attachment.'})])
          );
      } else {
        return [new DeleteAttachmentSuccess(payload)];
      }
    });

  @Effect()
  sendMailEffect: Observable<any> = this.actions
    .ofType(ComposeMailActionTypes.SEND_MAIL)
    .map((action: SendMail) => action.payload)
    .mergeMap((payload: Draft) => {
      if (payload.draft.dead_man_duration || payload.draft.delayed_delivery || payload.draft.destruct_date) {
        payload.draft.send = false;
        payload.draft.folder = MailFolderType.OUTBOX;
      } else {
        payload.draft.send = true;
        payload.draft.folder = MailFolderType.SENT;
      }
      return this.mailService.createMail(payload.draft)
        .pipe(
          switchMap(res => {
            return [
              new SendMailSuccess(payload),
              new UpdateCurrentFolder(res),
              new SnackPush({
                message: `Mail sent successfully`
              })
            ];
          }),
          catchError(err => [new SnackErrorPush({message: `Failed to send mail.`})])
        );
    });

  @Effect()
  getUsersKeysEffect: Observable<any> = this.actions
    .ofType(ComposeMailActionTypes.GET_USERS_KEYS)
    .map((action: GetUsersKeys) => action.payload)
    .mergeMap((payload: any) => {
      return this.mailService.getUsersPublicKeys(payload.emails)
        .pipe(
          switchMap((keys) => {
            return [
              new GetUsersKeysSuccess({draftId: payload.draftId, data: keys})
            ];
          })
        );
    });

}