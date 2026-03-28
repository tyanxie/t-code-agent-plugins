declare const ICONS: {
    readonly cost: "💰";
    readonly duration: "⏱️";
    readonly diff: "📝";
    readonly tools: "🔧";
    readonly agents: "🤖";
    readonly tasks: "📋";
};
export type IconName = keyof typeof ICONS;
export declare function getIcon(name: IconName): string;
export {};
