// src/components/UserDropdown.tsx
import React from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, User } from "@heroui/react";
import { Link } from "react-router-dom";

export const UserDropdown = ({ user, logout }: { user: any, logout: () => void }) => {
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <User
          as="button"
          avatarProps={{ isBordered: true, src: "https://i.pravatar.cc/150" }}
          className="transition-transform"
          name={user.email}
          description={user.role}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="User Actions" variant="flat">
        <DropdownItem key="dashboard" as={Link} href="/dashboard">
          Dashboard
        </DropdownItem>
        <DropdownItem key="logout" color="danger" onClick={logout}>
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};