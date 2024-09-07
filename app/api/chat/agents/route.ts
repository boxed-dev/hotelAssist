import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import twilio from 'twilio';

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { Serper } from "@langchain/community/tools/serper";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import * as hotelDatabase from "./hotelDatabase";

export const runtime = "nodejs"; // Ensure this runs in a Node.js environment

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

// Add Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const AGENT_SYSTEM_TEMPLATE = `You are a hotel booking assistant for Taj Hotel. You have access to the following data:

#### Schema

1. **Bookings**
   - **booking_id**: Unique identifier for each booking.
   - **user_id**: References the user who made the booking.
   - **room_id**: References the room that is booked.
   - **check_in_date**: Date when the user checks in.
   - **check_out_date**: Date when the user checks out.
   - **total_price**: Total price for the booking.

2. **Rooms**
   - **room_id**: Unique identifier for each room.
   - **room_number**: Room number.
   - **room_type**: Type of the room (e.g., Executive, Standard, Suite, Deluxe).
   - **price_per_night**: Price per night for the room.

3. **Users**
   - **user_id**: Unique identifier for each user.
   - **name**: Name of the user.
   - **email**: Email address of the user.
   - **phone**: Phone number of the user.
   - **address**: Address of the user.

#### Relationships

1. **User-Booking Relationship**:
   - Each booking is associated with a user.
   - The \`user_id\` in the bookings data references the \`user_id\` in the users data.

2. **Room-Booking Relationship**:
   - Each booking is associated with a room.
   - The \`room_id\` in the bookings data references the \`room_id\` in the rooms data.
If someone asks for booking details, you can search the user first using the tool then fetch the booking details using the tool.

Use this information to assist users with their booking inquiries.

MOST IMPORTANT: IF YOU CANT ASSIST WITH SOMETHING THEN SHOW THIS LINK TO THE USER: https://wa.me/918881920469?text=Hello where user can talk to CostumerAgent.
NOTE: NEVER SAY ANYTHING HYPOTHETICALLY KEEP IN MIND THAT YOU ARE TALKING TO A REAL PERSON AND YOU ARE HANDLING SOMEHING THAT INVOLCES MONEY SO BE VERY VERY CAUTIOUS.
After booking a room, always offer to send a detailed confirmation SMS to the user. Ask if they want to include full booking details in the SMS or prefer a brief confirmation. If the user agrees to receive an SMS, check if their phone number is available in their user details. If not, ask for their phone number before sending the confirmation.

Use the SendBookingConfirmation tool to send the SMS after obtaining the phone number and preference for detailed information. The tool takes a JSON input with booking_id, phone_number, and include_details flag.

Today's date is ${new Date().toLocaleDateString()}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;
    const messages = (body.messages ?? [])
      .filter(
        (message: VercelChatMessage) =>
          message.role === "user" || message.role === "assistant",
      )
      .map(convertVercelMessageToLangChainMessage);

    const tools = [
      new DynamicTool({
        name: "SearchUsers",
        description: "Search for users in the database. Input: user name or partial name",
        func: async (input: string) => JSON.stringify(await hotelDatabase.searchUsers(input)),
      }),
      new DynamicTool({
        name: "CreateUser",
        description: "Create a new user. Input: JSON string with user details (name, email, phone, address)",
        func: async (input: string) => JSON.stringify(await hotelDatabase.createUser(JSON.parse(input))),
      }),
      new DynamicTool({
        name: "GetUserBookings",
        description: "Retrieve a user's current bookings. Input: user ID",
        func: async (input: string) => JSON.stringify(await hotelDatabase.getUserBookings(input)),
      }),
      new DynamicTool({
        name: "SearchRooms",
        description: "Search for available rooms. Input: JSON string with startDate and endDate",
        func: async (input: string) => JSON.stringify(await hotelDatabase.searchRooms(JSON.parse(input))),
      }),
      new DynamicTool({
        name: "BookRoom",
        description: "Book a room for a user. Input: JSON string with user_id, room_id, check_in_date, check_out_date, total_price",
        func: async (input: string) => JSON.stringify(await hotelDatabase.bookRoom(JSON.parse(input))),
      }),
      new DynamicTool({
        name: "SendBookingConfirmation",
        description: "Send detailed booking confirmation SMS. Input: JSON string with booking_id, phone_number, and include_details flag",
        func: async (input: string) => {
          const { booking_id, phone_number, include_details } = JSON.parse(input);
          const result = await sendDetailedBookingConfirmationSMS(booking_id, phone_number, include_details);
          return JSON.stringify(result);
        },
      }),
      new DynamicTool({
        name: "CancelBooking",
        description: "Cancel an existing booking. Input: booking ID",
        func: async (input: string) => JSON.stringify(await hotelDatabase.cancelBooking(input)),
      }),
      new DynamicTool({
        name: "GetRoomTypes",
        description: "Get a list of available room types",
        func: async () => JSON.stringify(await hotelDatabase.getRoomTypes()),
      }),
      new DynamicTool({
        name: "InterpretDate",
        description: "Interpret natural language date inputs. Input: date string",
        func: async (input: string) => JSON.stringify(hotelDatabase.interpretDate(input)),
      }),
      new DynamicTool({
        name: "GetUserDetails",
        description: "Retrieve user details by their ID. Input: user ID",
        func: async (input: string) => JSON.stringify(await hotelDatabase.getUserDetails(input)),
      }),
      new DynamicTool({
        name: "UpdateUserInfo",
        description: "Update user information. Input: JSON string with user ID and updated details",
        func: async (input: string) => {
          const { userId, updates } = JSON.parse(input);
          return JSON.stringify(await hotelDatabase.updateUserInfo(userId, updates));
        },
      }),
      new DynamicTool({
        name: "GetBookingDetails",
        description: "Get booking details by booking ID. Input: booking ID",
        func: async (input: string) => JSON.stringify(await hotelDatabase.getBookingDetails(input)),
      }),
      new DynamicTool({
        name: "GetRoomDetails",
        description: "Get room details by room ID. Input: room ID",
        func: async (input: string) => JSON.stringify(await hotelDatabase.getRoomDetails(input)),
      }),
      new DynamicTool({
        name: "GetTodaysDate",
        description: "Get today's date",
        func: async () => JSON.stringify({ date: hotelDatabase.getTodaysDate() }),
      }),
      new Calculator(),
    ];

    const chat = new ChatOpenAI({
      model: "gpt-4-turbo-preview",
      temperature: 0,
    });

    /**
     * Use a prebuilt LangGraph agent.
     */
    const agent = createReactAgent({
      llm: chat,
      tools,
      /**
       * Modify the stock prompt in the prebuilt agent. See docs
       * for how to customize your agent:
       *
       * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
       */
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    });

    if (!returnIntermediateSteps) {
      /**
       * Stream back all generated tokens and steps from their runs.
       *
       */
      const eventStream = await agent.streamEvents(
        { messages },
        { version: "v2" },
      );

      const textEncoder = new TextEncoder();
      const transformStream = new ReadableStream({
        async start(controller) {
          for await (const { event, data } of eventStream) {
            if (event === "on_chat_model_stream") {
              // Intermediate chat model generations will contain tool calls and no content
              if (!!data.chunk.content) {
                controller.enqueue(textEncoder.encode(data.chunk.content));
              }
            }
          }
          controller.close();
        },
      });

      return new StreamingTextResponse(transformStream);
    } else {
      const result = await agent.invoke({ messages });
      return NextResponse.json(
        {
          messages: result.messages.map(convertLangChainMessageToVercelMessage),
        },
        { status: 200 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

// Add a function to send SMS
async function sendDetailedBookingConfirmationSMS(bookingId: string, phoneNumber: string, includeDetails: boolean) {
  try {
    const bookingDetails = await hotelDatabase.getBookingDetails(bookingId);
    const roomDetails = await hotelDatabase.getRoomDetails(bookingDetails.room_id);
    const userDetails = await hotelDatabase.getUserDetails(bookingDetails.user_id);

    let messageBody = `Dear ${userDetails.name},\n\nThank you for choosing Taj Hotel for your stay. Your booking has been confirmed!\n\n`;
    
    if (includeDetails) {
      messageBody += `Booking Details:\n`;
      messageBody += `- Booking ID: ${bookingId}\n`;
      messageBody += `- Room Type: ${roomDetails.room_type}\n`;
      messageBody += `- Check-in: ${bookingDetails.check_in_date}\n`;
      messageBody += `- Check-out: ${bookingDetails.check_out_date}\n`;
      messageBody += `- Total Price: $${bookingDetails.total_price}\n\n`;
    }

    messageBody += `We look forward to welcoming you to Taj Hotel. If you have any questions, please don't hesitate to contact us.\n\nBest regards,\nTaj Hotel Team`;

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`Detailed SMS sent successfully. SID: ${message.sid}`);
    return { success: true, message: "Detailed confirmation SMS sent successfully" };
  } catch (error) {
    console.error('Error sending detailed SMS:', error);
    return { success: false, message: "Failed to send detailed confirmation SMS" };
  }
}
