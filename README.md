# 🛠️ nest-cqrs-schematics

A custom schematic collection to generate **Command** and **Query** files (along with their handlers) for [NestJS](https://nestjs.com/) projects using the **CQRS** pattern.

> ⚡️ Built to save time and reduce boilerplate when working with `@nestjs/cqrs`.

---

## ✨ Features

- 🧩 Generate **Command** and **CommandHandler**
- 🔍 Generate **Query** and **QueryHandler**
- 🚀 Quick scaffolding using Nest CLI
- ✍️ Easily customizable boilerplate after generation

---

## 📆 Installation

Install the package as a **dev dependency**:

```bash
pnpm add -D nest-cqrs-schematics
```

> You can also use `npm` or `yarn` if preferred.

---

## 🚀 Usage

Run the following commands using the NestJS CLI:

### Generate a Command

```bash
nest g -c nest-cqrs-schematics command create-user src/modules/features/users
```

**Generates:**

```
src/
└── modules/
    └── features/
        └── users/
            └── commands/
                ├── impl/
                │   └── create-user.command.ts
                └── handlers/
                    └── create-user.handler.ts
```

---

### Generate a Query

```bash
nest g -c nest-cqrs-schematics query get-user src/modules/features/users
```

**Generates:**

```
src/
└── modules/
    └── features/
        └── users/
            └── queries/
                ├── impl/
                │   └── get-user.query.ts
                └── handlers/
                    └── get-user.handler.ts
```

---

## 🔧 Example Output

### `create-user.command.ts`

```ts
export class CreateUserCommand {
  constructor(public readonly name: string, public readonly email: string) {}
}
```

### `create-user.handler.ts`

```ts
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateUserCommand } from "../impl/create-user.command";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    const { name, email } = command;

    // TODO: Implement business logic
  }
}
```

---

## 🔮 Coming Soon

Planned for future versions:

- 📣 Support for **Events** and **Event Handlers**
- 🔁 Support for **Sagas**
- 🎛️ Custom configuration options (e.g., naming, file structure)

---

## 💡 Notes

- This package only works with **NestJS** projects.
- Ensure you have the `@nestjs/cqrs` module installed in your project.
- Generated code is fully editable and meant to be a starting point.

---

## 👨‍💼 Developed By

This tool was developed to streamline CQRS implementation in NestJS apps.\
Feel free to contribute or share feedback!

---

## 📄 License

MIT
