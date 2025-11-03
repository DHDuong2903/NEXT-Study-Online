import { QuickActionType } from "@/constants";
import { Card } from "./ui/card";

const colorMap: Record<string, { text: string; border: string; hoverText: string }> = {
  green: {
    text: "text-green-500",
    border: "hover:border-green-500",
    hoverText: "group-hover:text-green-500",
  },
  purple: {
    text: "text-purple-500",
    border: "hover:border-purple-500",
    hoverText: "group-hover:text-purple-500",
  },
  blue: {
    text: "text-blue-500",
    border: "hover:border-blue-500",
    hoverText: "group-hover:text-blue-500",
  },
  orange: {
    text: "text-orange-500",
    border: "hover:border-orange-500",
    hoverText: "group-hover:text-orange-500",
  },
  red: {
    text: "text-red-500",
    border: "hover:border-red-500",
    hoverText: "group-hover:text-red-500",
  },
};

const ActionCard = ({ action, onClick }: { action: QuickActionType; onClick: () => void }) => {
  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer ${colorMap[action.color].border}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-100 group-hover:opacity-50 transition-opacity" />

      <div className="relative p-6 size-full">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <action.icon className={`h-6 w-6 ${colorMap[action.color].text}`} />
          </div>

          <div className="space-y-1">
            <h3 className={`font-semibold text-xl transition-colors ${colorMap[action.color].hoverText}`}>
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActionCard;
