
Project Summary
This project is a Todo application designed with simplicity in mind, both visually and functionally. The core features include creating, editing, and deleting todos, as well as filtering and sorting them by various parameters. Users can choose to view their todos either in a list view or a calendar view, depending on their preference.
To improve organization, the application supports tags, which allow users to group and manage related todos efficiently. One of the main strengths of this application is its minimalistic design, which avoids unnecessary elements and focuses only on essential functionality. This helps keep the user experience clean and intuitive.
A potential weakness of the application is the lack of animations, which can make interactions feel less smooth compared to more dynamic interfaces. Additionally, there is room for further code optimization and refactoring as the project evolves.
The application is built using vanilla TypeScript and the Vite build tool. External resources such as Google Fonts and Font Awesome are used for typography and icons. Authentication functionality has also been implemented, allowing users to securely store their todos and access them from anywhere.

What is TypeScript and why use it instead of JavaScript?
TypeScript is a superset of JavaScript, meaning it extends JavaScript by adding additional features while remaining fully compatible with it. In real-world development, TypeScript is often treated as JavaScript with extra tooling rather than a completely separate language.
The main advantage of TypeScript is its static type system, which allows developers to define and restrict data types. This helps ensure that values flow through the application as expected and enables many errors to be detected at compile time, before the code is even run. Overall, TypeScript provides better control, improved maintainability, and increased robustness, especially in medium-to-large projects.

Difference between unknown, any, and specific types like string
* unknown is used when the type of a value is not known in advance. It is commonly used for handling data from external or unpredictable sources, such as events or API responses. Before using a value of type unknown, it must be explicitly checked or narrowed, making it a safer alternative to any.
* any disables type checking entirely. It should be used sparingly, only in cases where multiple output types are possible and the value will be handled later in the code. Overusing any removes the benefits of TypeScript and can lead to runtime errors.
* Specific types, such as string, number, or custom types, are used when the expected value is known. These should be preferred whenever possible, as they enforce correctness and help ensure the proper flow of data throughout the application.

Why use types and interfaces in TypeScript?
Types and interfaces are essential for consistency and scalability. Defining a type or interface once and reusing it across multiple files ensures that the same data structure is expected throughout the application.
In larger projects, this becomes especially important, as tracking object structures manually becomes increasingly difficult. Types and interfaces reduce the risk of mistakes, improve readability, and make refactoring safer and easier. They play a crucial role in maintaining long-term code quality and reliability.
