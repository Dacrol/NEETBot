declare const debug: any;
declare const Composer: any;
declare const safePassThru: any;
declare const noop: () => any;
declare const now: () => number;

declare class SceneContext extends TelegrafContext{
    scene: scene.SceneContext;
    test: Test
}

declare namespace scene {
  export class SceneContext {
    constructor(ctx: any, scenes: any, options: any);
    readonly session: any;
    state: any;
    readonly current: any;
    reset(): void;
    enter(sceneId: any, initialState: any, silent: any): any;
    reenter(): any;
    leave(): any;
  }
}
