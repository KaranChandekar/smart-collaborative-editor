"use client";

import type { WebrtcProvider } from "y-webrtc";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CursorPresenceProps {
  provider: WebrtcProvider | null;
  currentUser: { name: string; color: string } | null;
}

interface AwarenessUser {
  name: string;
  color: string;
}

export function CursorPresence({ provider, currentUser }: CursorPresenceProps) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateUsers = () => {
      const states = awareness.getStates();
      const connectedUsers: AwarenessUser[] = [];

      states.forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.user) {
          connectedUsers.push(state.user);
        }
      });

      setUsers(connectedUsers);
    };

    awareness.on("change", updateUsers);
    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [provider]);

  const allUsers = currentUser ? [currentUser, ...users] : users;

  if (allUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {allUsers.map((user, index) => (
        <Tooltip key={index}>
          <TooltipTrigger>
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarFallback
                className="text-[10px] font-medium text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {user.name}
              {index === 0 && currentUser ? " (you)" : ""}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
      {users.length > 0 && (
        <span className="ml-3 text-xs text-muted-foreground">
          {users.length + 1} online
        </span>
      )}
    </div>
  );
}
