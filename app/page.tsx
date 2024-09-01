import { ChatWindow } from "@/components/ChatWindow";

export default function AgentsPage() {
  const InfoCard = (
    <div className="p-4 md:p-8 rounded bg-[#030303] w-full max-h-[85%] overflow-hidden">
      <h1 className="text-3xl md:text-4xl mb-4 text-center">
        🏨 Hotel Booking Assistant
      </h1>
      <p className="text-center text-l">
        Ask me about hotel bookings, availability, and more!
      </p>
    </div>
  );

  return (
    <ChatWindow
      endpoint="api/chat/agents"
      emptyStateComponent={InfoCard}
      placeholder="Ask me about hotel bookings..."
      titleText="Hotel Booking Assistant"
      emoji="🏨"
      showIntermediateStepsToggle={true}

    ></ChatWindow>
  );
}
