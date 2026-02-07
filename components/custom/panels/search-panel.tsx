"use client";

import cx from "classnames";
import Link from "next/link";
import { useParams } from "next/navigation";
import { User } from "next-auth";
import { useState, useMemo } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";

import { IChat } from "@/db/models";
import { fetcher } from "@/lib/utils";

type ChatListItem = IChat & { id: string };

import { InfoIcon } from "../icons";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

export const SearchPanel = ({
  user,
}: {
  user: User | undefined;
}) => {
  const { id } = useParams();
  const [query, setQuery] = useState("");

  const { data: history } = useSWR<Array<ChatListItem>>(
    user ? "/api/history" : null,
    fetcher,
    { fallbackData: [] },
  );

  const filteredChats = useMemo(() => {
    if (!history || !query.trim()) return history || [];
    const lower = query.toLowerCase();
    return history.filter(
      (chat) => chat.title?.toLowerCase().includes(lower),
    );
  }, [history, query]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Search</h2>
        <p className="text-sm text-muted-foreground">Find conversations</p>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
            <InfoIcon size={32} />
            <p className="mt-2">Please log in to search chats.</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
            <InfoIcon size={32} />
            <p className="mt-2">
              {query.trim() ? "No matching chats found." : "Type to search your chats."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={cx(
                  "flex items-center p-3 rounded-lg hover:bg-card transition-colors",
                  {
                    "bg-card shadow-sm":
                      chat.id === id,
                  },
                )}
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start p-0 h-auto font-normal text-left"
                  asChild
                >
                  <Link
                    href={`/chat/${chat.id}`}
                    className="block truncate"
                    title={chat.title || "Untitled Chat"}
                  >
                    <div className="text-sm font-medium text-foreground truncate">
                      {chat.title || "Untitled Chat"}
                    </div>
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
