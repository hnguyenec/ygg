import { TheThing, TheThingImitation, RelationDefine } from '@ygg/the-thing/core';

export const Sam = new TheThing().fromJSON({
  name: 'Samwise Gamgee',
  tags: ['hobbit', 'gay', 'fat', 'drama queen'],
  cells: {
    photos: {
      name: 'photos',
      type: 'album',
      value: {
        cover: 'https://i.redd.it/1pbjx7yn76h31.jpg',
        photos: [
          'https://i.pinimg.com/originals/d2/d2/83/d2d28345d9a5f3f5e1d098212224b3a9.jpg',
          'https://www.thevintagenews.com/wp-content/uploads/2017/11/yspc7azt.jpg',
          'https://i.pinimg.com/originals/08/5c/af/085caf0855eb54b23a558578adbea839.jpg',
          'https://images.indianexpress.com/2017/11/frodo-sam-lord-of-the-rings-759.jpg',
          'https://images3.memedroid.com/images/UPLOADED466/5d34c6916fc9a.jpeg',
          'https://i.kym-cdn.com/photos/images/original/000/335/116/50b.jpg',
          'https://pics.me.me/enough-teasing-its-time-frodo-bend-over-and-take-this-54210315.png',
          'https://i.redd.it/1pbjx7yn76h31.jpg'
        ]
      }
    }
  }
});

export const Frodo = new TheThing().fromJSON({
  name: 'Frodo Baggins',
  tags: ['hobbit', 'my master', "possess some others weapons"],
  cells: {
    photos: {
      name: 'photos',
      type: 'album',
      value: {
        cover: 'https://img.memecdn.com/chicken-nugget-frodo_o_4166515.jpg',
        photos: [
          'https://i.pinimg.com/originals/d0/a6/0c/d0a60c93cd67338d0fff24613b520985.jpg',
          'https://pics.me.me/for-frodo-who-the-hell-is-frodo-i-would-like-37873823.png',
          'https://i.pinimg.com/736x/11/7d/66/117d6689ff7e4c75206bbd362b6e1836.jpg',
          'https://img.memecdn.com/chicken-nugget-frodo_o_4166515.jpg',
          'https://pbs.twimg.com/media/DHoFnZ5UAAAZdYH.jpg',
          'https://images7.memedroid.com/images/UPLOADED111/561c0e0f69182.jpeg'
        ]
      }
    }
  }
});

export const Gollum = new TheThing().fromJSON({
  name: 'Gollum',
  tags: ['hobbit', 'psychopath', "preeeeeeeeecious"],
  cells: {
    photos: {
      name: 'photos',
      type: 'album',
      value: {
        cover: 'https://images7.memedroid.com/images/UPLOADED170/565f936f42e6e.jpeg',
        photos: [
          'https://i.pinimg.com/474x/75/7d/8a/757d8a84bb129cfc17bf017f8b0f0bca--big-butts-so-true.jpg',
          'https://i.pinimg.com/originals/c4/08/21/c40821b7e05d3d2effc2744081128ae7.jpg',
          'https://pics.me.me/hello-my-precious-makeameme-org-hello-my-precious-gollum-meme-54141211.png',
          'https://www.memesmonkey.com/images/memesmonkey/a8/a835360fe9b63c70d149577e4b755200.jpeg',
          'http://www.quickmeme.com/img/6e/6e30d7a7441a6c32a0cbd461fe3bb6fa90594d8f6aad669d74fa0428fec34fce.jpg',
          'https://images7.memedroid.com/images/UPLOADED170/565f936f42e6e.jpeg'
        ]
      }
    }
  }
});

export const ImitationFrodo = new TheThingImitation().fromJSON({
  name: 'Frodo Ball-Baggins',
  image: 'https://img.memecdn.com/chicken-nugget-frodo_o_4166515.jpg',
  description: 'MY sword, MY axe, MY bow, MY ring, ALL MINE~!!!',
  cellsDef: [
    {
      name: 'photos',
      type: 'album',
      required: true
    },
    {
      name: 'master level',
      type: 'number',
      required: true
    },
    {
      name: 'number of followers',
      type: 'number',
      required: true
    },
  ]
});

export const ImitationGollum = new TheThingImitation().fromJSON({
  name: 'Not That Ugly Dobby in Harry Potter',
  image: 'https://images7.memedroid.com/images/UPLOADED170/565f936f42e6e.jpeg',
  description: 'Dirty thieves...Me say Master ....... Dirty Fucking Thieves...',
  cellsDef: [
    {
      name: 'photos',
      type: 'album',
      required: true
    },
    {
      name: 'my precious',
      type: 'text',
      required: true
    },
    {
      name: 'how to eat fish',
      type: 'html',
      required: true
    },
  ]
});

export const relationGollumToFrodo = new RelationDefine({
  name: "Psychopath keeps calling me master",
  imitationId: ImitationGollum.id
});

ImitationFrodo.addRelationDefine(relationGollumToFrodo);

export const relationSamToGollum = new RelationDefine({
  name: "Masters gay fwend"
});

ImitationGollum.addRelationDefine(relationSamToGollum);

