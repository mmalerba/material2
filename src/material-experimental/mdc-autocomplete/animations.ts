/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  animate,
  AnimationTriggerMetadata,
  group,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

// Animation values come from
// https://github.com/material-components/material-components-web/blob/master/packages/mdc-menu-surface/_mixins.scss
// TODO(mmalerba): Ideally find a way to import the values from MDC's code.
export const panelAnimation: AnimationTriggerMetadata = trigger('panelAnimation', [
  state('hidden', style({})),
  state('visible', style({})),
  transition(':enter, hidden => visible', [
    style({
      opacity: 0,
      transform: 'scale(0.8)',
    }),
    group([
        animate('0.03s linear', style({ opacity: 1 })),
        animate('0.12s cubic-bezier(0, 0, 0.2, 1)', style({ transform: 'scale(1)' })),
    ]),
  ]),
  transition(':leave, visible => hidden', [
    animate('0.075s linear', style({ opacity: 0 })),
  ]),
]);
