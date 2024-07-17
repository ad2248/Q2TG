import { Pair } from '../models/Pair';
import { Member as OicqMember } from '@icqqjs/icqq';
import { format } from 'date-and-time';
import { Group, GroupMemberInfo } from '../client/QQClient';
import { NapCatFriend, NapCatGroupMember } from '../client/NapCatClient';
import { Elysia } from 'elysia';
import { html, Html } from '@elysiajs/html';
import { UserProfile } from '@icqqjs/icqq/lib/common';
import OicqClient from '../client/OicqClient';

export default new Elysia()
  .use(html())
  .get('/:apiKey/:userId', async ({ params, error }) => {
    const pair = Pair.getByApiKey(params.apiKey);
    if (!pair) {
      return error(404, 'Group not found');
    }
    const group = pair.qq as Group;
    const member = group.pickMember(Number(params.userId), true);
    if (!member) {
      return error(404, 'Member not found');
    }
    let profile: UserProfile, memberInfo: GroupMemberInfo;
    if (member instanceof OicqMember) {
      memberInfo = member.info;
      profile = await (group.client as OicqClient).oicq.getProfile(member.uid);
    }
    else if (member instanceof NapCatGroupMember) {
      memberInfo = await member.renew();
      const user = await member.client.pickFriend(member.uid) as NapCatFriend;
      const info = await user.renew();
      profile = {
        birthday: [info.birthday_year, info.birthday_month, info.birthday_day],
        email: info.eMail,
        nickname: info.nickname,
        city: info.city,
        QID: info.qid,
        country: info.country,
        province: info.province,
        signature: '',
        regTimestamp: info.regTime,
      };
    }
    else {
      throw new Error('Unknown client type');
    }

    const now = new Date();
    const location = [profile.country, profile.province, profile.city].join(' ').trim();
    const birthday = (profile.birthday || []).some(it => it) && profile.birthday.join('/');

    // language=CSS
    return <html lang="zh">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta property="og:image"
            content={`https://q1.qlogo.cn/g?b=qq&nk=${params.userId}&s=0&time=${format(now, 'YYYY-MM-DD')}`}/>
      {
        memberInfo.title ?
          <meta property="og:site_name" content={`「${memberInfo.title}」`}/> :
          <meta property="og:site_name" content={memberInfo.role}/>
      }
      <meta property="og:title" content={memberInfo.card || memberInfo.nickname}/>
      <title>群成员：{memberInfo.card || memberInfo.nickname}</title>
      <style>{`
        html, body {
          padding: 0;
          margin: 0;
          color: #303133;
        }

        * {
          box-sizing: border-box;
        }

        #app {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }

        #avatar, #card {
          width: 100%;
          max-width: 500px;
        }

        #card {
          padding: 0 20px;
          line-height: 1.8em;
        }

        .badge {
          border-radius: 0.5em;
          color: #fff;
          padding: 0 0.2em;
        }

        .badge-owner {
          background-color: #FDCE3A !important;
        }

        .badge-admin {
          background-color: #2FE1D8 !important;
        }

        .badge-member {
          background-color: #ADB5CA;
        }

        .badge-hasTitle {
          background-color: #D88BFF;
        }

        .secondary {
          color: #606266;
          font-size: small;
        }

        .detailItem {
          font-size: smaller;
          margin-top: 0.5em;
        }

        @media screen and (min-width: 900px) {
          #app {
            flex-direction: row;
            height: 100vh;
          }

          #avatar {
            width: 400px;
          }

          #card {
            width: fit-content;
          }
        }
      `}</style>
    </head>
    <body>
    <div id="app">
      <img id="avatar" src={`https://q1.qlogo.cn/g?b=qq&nk=${params.userId}&s=0`} alt="头像"/>
      <div id="card">
        <div>
          <span class={`badge badge-${memberInfo.role} ${memberInfo.title && 'badge-hasTitle'}`}>{memberInfo.title || memberInfo.role}</span>
          {memberInfo.card || memberInfo.nickname}
        </div>
        {memberInfo.card && <div class="secondary">
          {memberInfo.nickname}
        </div>}
        <div class="secondary">
          {params.userId}
          {profile.QID && <span style="padding-left: 1em">QID: {profile.QID}</span>}
          {profile.email && <span style="padding-left: 1em">{profile.email}</span>}
        </div>
        {location && <div class="secondary">{location}</div>}
        {birthday &&
          <div class="detailItem">
            <div class="secondary">生日</div>
            {birthday}
          </div>
        }
        <div class="detailItem">
          <div class="secondary">加入时间</div>
          {format(new Date(memberInfo.join_time * 1000), 'YYYY-MM-DD HH:mm')}
        </div>
        <div class="detailItem">
          <div class="secondary">上次发言时间</div>
          {format(new Date(memberInfo.last_sent_time * 1000), 'YYYY-MM-DD HH:mm')}
        </div>
        <div class="detailItem">
          <div class="secondary">注册时间</div>
          {format(new Date(profile.regTimestamp * 1000), 'YYYY-MM-DD HH:mm')}
        </div>
      </div>
    </div>
    </body>
    </html>;
  });
