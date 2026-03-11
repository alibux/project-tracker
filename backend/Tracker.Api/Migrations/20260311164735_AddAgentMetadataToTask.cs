using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentMetadataToTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivityStatus",
                table: "Tasks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeAgentEmoji",
                table: "Tasks",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeAgentKey",
                table: "Tasks",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeAgentName",
                table: "Tasks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAgentUpdateAt",
                table: "Tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastAgentUpdateText",
                table: "Tasks",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivityStatus",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssigneeAgentEmoji",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssigneeAgentKey",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssigneeAgentName",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "LastAgentUpdateAt",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "LastAgentUpdateText",
                table: "Tasks");
        }
    }
}
