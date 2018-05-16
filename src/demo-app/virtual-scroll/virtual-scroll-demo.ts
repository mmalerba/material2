/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, ViewEncapsulation} from '@angular/core';
import {BehaviorSubject} from 'rxjs';


type State = {
  name: string,
  capital: string
};


@Component({
  moduleId: module.id,
  selector: 'virtual-scroll-demo',
  templateUrl: 'virtual-scroll-demo.html',
  styleUrls: ['virtual-scroll-demo.css'],
  encapsulation: ViewEncapsulation.None,
})
export class VirtualScrollDemo {
  images = new BehaviorSubject<string[]>([]);

  trackByIndex = (i: number) => i;

  private _images = [
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12224408/Shiba-Inu-On-White-03.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12224412/Shiba-Inu-On-White-01.jpg',
      'http://cdn1-www.dogtime.com/assets/uploads/gallery/shiba-inu-dog-breed-picutres/thumbs/thumbs_8-side.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12224425/Shiba-Inu-Care.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Taka_Shiba.jpg/1200px-Taka_Shiba.jpg',
      'https://myfirstshiba.com/wp-content/uploads/2016/01/AdobeStock_115842268_white_background-copy.jpg',
      'https://canna-pet.com/wp-content/uploads/2017/09/shiba-inu-temperament-and-personality_canna-pet-1024x683.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Shiba_inu_taiki.jpg/220px-Shiba_inu_taiki.jpg',
      'http://cdn2-www.dogtime.com/assets/uploads/gallery/shiba-inu-dog-breed-picutres/5-puppy-pg_.jpg',
      'http://cdn1-www.dogtime.com/assets/uploads/gallery/shiba-inu-dog-breed-picutres/thumbs/thumbs_6-face.jpg',
      'http://static.ddmcdn.com/en-us/apl/breedselector/images/breed-selector/dogs/breeds/shiba-inu_01_lg.jpg',
      'https://gfp-2a3tnpzj.stackpathdns.com/wp-content/uploads/2016/07/Shiba-Inu-Puppies-for-Sale-600x600.jpg',
      'http://cdn1-www.dogtime.com/assets/uploads/gallery/shiba-inu-dog-breed-picutres/thumbs/thumbs_4-blacksitting.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12224410/Shiba-Inu-On-White-02.jpg',
      'https://images.wagwalkingweb.com/media/breed/shiba-inu/appearance/shiba-inu.png?auto=compress&fit=max',
      'https://myfirstshiba.com/wp-content/uploads/2018/02/mind_stimulation-copy.jpg',
      'https://barkpost.com/wp-content/uploads/2016/07/shiba-probs-feature-5.jpg',
      'http://www.petguide.com/wp-content/uploads/2013/02/shiba-inu-1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Shiba_Inu_600.jpg/170px-Shiba_Inu_600.jpg',
      'https://s3.amazonaws.com/media.ohi/16762_download_6f.jpeg',
      'https://upload.wikimedia.org/wikipedia/commons/2/20/Shiba_Inu.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg0D9TmiRXoWe2EQQby3d5jiWK5anHcWowsy4Pa_P9hfZyqSw',
      'https://www.purina.com/sites/g/files/auxxlc196/files/styles/kraken_generic_max_width_240/public/NonSporting_ShibaInu_2588.jpg?itok=GmDt0T7h',
      'https://myfirstshiba.com/wp-content/uploads/2016/01/AdobeStock_95140430_reduced.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12212010/Shiba-Inu-History-06-500x498.jpg',
      'https://d20vvx1que2zyx.cloudfront.net/wp-content/uploads/2018/02/04193819/Screen-Shot-2018-02-04-at-7.27.33-PM.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fm_shiba_inu_puppy.jpg/220px-Fm_shiba_inu_puppy.jpg',
      'https://www.petwave.com/-/media/Images/Center/Breed/Dogs/Non-Sporting-Group/Shiba-Inu/Shiba-Inu-4.ashx?w=450&hash=E8C3962BA67D637B688E846DA5FF09745AB7E7E1',
      'http://dcsir.org/wp-content/uploads/2017/12/Screen-Shot-2017-12-16-at-7.43.20.png',
      'https://vetstreet.brightspotcdn.com/dims4/default/0f42b23/2147483647/crop/0x0%2B0%2B0/resize/645x380/quality/90/?url=https%3A%2F%2Fvetstreet-brightspot.s3.amazonaws.com%2F05%2Fae6220a81c11e0a0d50050568d634f%2Ffile%2FShiba-Inu-5-645mk070111.jpg',
      'https://metrouk2.files.wordpress.com/2018/02/berry-featured-3.jpg?quality=80&strip=all',
      'https://res.cloudinary.com/jerrick/image/upload/f_auto,fl_progressive,q_auto,c_fit,w_600/gyilfi2xiuqdlpujw342',
      'http://img1.wsimg.com/isteam/ip/f30e058e-5c59-453f-beaa-942b40ec97bd/9fa1677b-264c-4925-ab01-ef3c2a751718.jpg',
      'https://cdn.europosters.eu/image/1300/calendar/shiba-inu-i50811.jpg',
      'https://cdn.shopify.com/s/files/1/1583/8217/products/Shiba_Inu_Collage_Sweatshirt_1024x1024.png?v=1511469600',
      'https://canna-pet.com/wp-content/uploads/2017/08/shiba-inu-2231866_1920-1024x776.jpg',
      'https://cdn.shopify.com/s/files/1/1368/5523/products/Shiba_4700_F2_1024x1024.jpg?v=1508023663',
      'http://static.ddmcdn.com/en-us/apl/breedselector/images/breed-selector/dogs/breeds/shiba-inu_04_lg.jpg',
      'http://cdn1-www.dogtime.com/assets/uploads/gallery/shiba-inu-dog-breed-picutres/thumbs/thumbs_7-senior.jpg',
      'https://i.imgur.com/6YEsRvX.jpg',
      'https://metrouk2.files.wordpress.com/2018/02/shiba-berry-3-e1517667071447.jpg',
      'https://myfirstshiba.com/wp-content/uploads/2016/01/AdobeStock_139472169_reducedl_white_backgroudn.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/25230914/Shiba-Inu-Dog-slide-04.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Siro-shiba.JPG/200px-Siro-shiba.JPG',
      'https://cdn.shopify.com/s/files/1/0228/8535/products/AOPTS0533U_Shiba_Inu_Mockup.jpg?v=1443787965',
      'https://moderndogmagazine.com/sites/default/files/styles/slidehsow-banner/public/images/breeds/top_images/ShibaInu-Header.jpg?itok=sZsyst9Z',
      'https://i.ytimg.com/vi/rRiLKlH8wmQ/hqdefault.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRh8KcN89rzSjM-nXSu-RwJ1yuZq4ptvPIEDU0-areqpivvnsWNwA',
      'http://cdn2.sortra.com/wp-content/uploads/2017/04/ryuji-shiba23.jpg',
      'https://nextshark-vxdsockgvw3ki.stackpathdns.com/wp-content/uploads/2017/04/cute-dog-shiba-inu-ryuji-japan-28.jpg',
      'https://www.dailydot.com/wp-content/uploads/503/f1/107c674265d57f18ffd0331b2fb491b8.jpg',
      'https://www.rover.com/blog/wp-content/uploads/2015/06/shiba-inu-shibe-doge-quiz.jpg',
      'https://www.omlet.us/images/cache/1024/682/Dog-Japanese_Shiba_Inu-Two_healthy_adult_Japanese_Shiba_Inus_standing_tall_together.jpg',
  ];

  constructor() {
    this._preload();
  }

  private _preload() {
    this._images.forEach(url => {
      const img = new Image();
      img.addEventListener('load', () => this.images.next(this.images.value.concat([url])));
      img.src = url;
    });
  }
}
