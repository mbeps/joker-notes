"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { ChevronsLeftRight } from "lucide-react";
import type React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Sidebar dropdown that shows the active Clerk user and exposes sign-out controls.
 * Mirrors the design system avatar and leverages Clerk's `SignOutButton`.
 *
 * @returns Dropdown populated with the current Clerk user's profile and actions.
 * @see https://clerk.com/docs/components/sign-out-button
 */
const UserItem: React.FC = () => {
  /**
   * Currently logged in user.
   * Provided by Clerk.
   */
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center rounded-lg p-3 text-sm hover:bg-primary/5">
        <div className="flex max-w-[150px] items-center gap-x-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={user?.imageUrl} />
          </Avatar>
          <span className="line-clamp-1 text-start font-medium">
            {`${user?.fullName}'s Joker`}
          </span>
        </div>
        <ChevronsLeftRight className="ml-2 h-4 w-4 rotate-90 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuPositioner align="start" alignOffset={11}>
        <DropdownMenuContent className="w-80">
          <div className="flex flex-col space-y-4 p-2">
            <p className="font-medium text-muted-foreground text-xs leading-none">
              {user?.emailAddresses[0].emailAddress}
            </p>
            <div className="flex items-center gap-x-2">
              <div className="rounded-md bg-secondary p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} />
                </Avatar>
              </div>
              <div className="space-y-1">
                <p className="line-clamp-1 text-sm">
                  {`${user?.fullName}'s Joker`}
                </p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<SignOutButton />}
            className="w-full cursor-pointer text-muted-foreground"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  );
};

export default UserItem;
