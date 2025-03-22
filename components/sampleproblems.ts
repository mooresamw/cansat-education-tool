const sampleproblems = [
  {
    id: "arduino-1",
    title: "Hello World",
    description: "Write a program that prints 'Hello, World!' to the Serial Monitor.",
    difficulty: "Easy",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  // Your code here\n}\n\nvoid loop() {\n  // No need to use loop() for this problem\n}",
    hint: "Use Serial.println() to print a message.",
    explanation: "This problem introduces Serial communication in Arduino, which is used to display text on the Serial Monitor.",
    expectedOutput: "Hello, World!"
  },
  {
    id: "arduino-2",
    title: "Countdown Timer",
    description: "Write a program that prints a countdown from 10 to 1, followed by 'Liftoff!'.",
    difficulty: "Easy",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  // Your code here\n}\n\nvoid loop() {\n  // No need to use loop() for this problem\n}",
    hint: "Use a for loop to iterate from 10 down to 1 and print each number using Serial.println().",
    explanation: "This program uses a for loop to count down from 10 and prints each number using Serial.println(). After the loop finishes, it prints 'Liftoff!'.",
    expectedOutput: "10\n9\n8\n7\n6\n5\n4\n3\n2\n1\nLiftoff!"
  },
  {
    id: "arduino-3",
    title: "Sum of Two Numbers",
    description: "Write a program that declares two integer variables, adds them together, and prints the result.",
    difficulty: "Easy",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int a = 5;\n  int b = 10;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use the '+' operator to add two numbers and print the result.",
    explanation: "This problem teaches how to use variables and arithmetic operations in Arduino.",
    expectedOutput: "15"
  },
  {
    id: "arduino-4",
    title: "Even or Odd",
    description: "Write a program that checks whether a given number is even or odd and prints the result.",
    difficulty: "Easy",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int num = 7;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use the modulus (%) operator to check if a number is divisible by 2.",
    explanation: "Using the modulus operator, we can check if a number is even (num % 2 == 0) or odd.",
    expectedOutput: "Odd"
  },
  {
    id: "arduino-5",
    title: "Greatest of Two Numbers",
    description: "Write a program that compares two numbers and prints the greater one.",
    difficulty: "Easy",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int a = 8;\n  int b = 12;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use if-else statements to compare the two numbers.",
    explanation: "Using if-else conditions, we can determine the larger of two numbers.",
    expectedOutput: "12"
  },
  {
    id: "arduino-6",
    title: "Simple Calculator",
    description: "Write a program that performs addition, subtraction, multiplication, and division on two numbers and prints the results.",
    difficulty: "Medium",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int a = 20;\n  int b = 4;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use arithmetic operators (+, -, *, /) to perform calculations.",
    explanation: "This problem demonstrates how to perform basic arithmetic operations in Arduino.",
    expectedOutput: "Addition: 24\nSubtraction: 16\nMultiplication: 80\nDivision: 5"
  },
  {
    id: "arduino-7",
    title: "Find the Square Root",
    description: "Write a program that calculates the square root of a given number.",
    difficulty: "Medium",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  float num = 16.0;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use the sqrt() function to find the square root of a number.",
    explanation: "The sqrt() function from math operations helps compute square roots in Arduino.",
    expectedOutput: "4.0"
  },
  {
    id: "arduino-8",
    title: "Number Comparison",
    description: "Write a program that checks if a number is positive, negative, or zero.",
    difficulty: "Medium",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int num = -5;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use if-else statements to check conditions.",
    explanation: "Using conditions, we can determine if a number is positive, negative, or zero.",
    expectedOutput: "Negative"
  },
  {
    id: "arduino-9",
    title: "Factorial Calculation",
    description: "Write a program that calculates the factorial of a number (e.g., 5! = 5*4*3*2*1).",
    difficulty: "Medium",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int num = 5;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use a for loop to multiply numbers from 1 to num.",
    explanation: "The factorial is calculated using a loop to multiply numbers in descending order.",
    expectedOutput: "120"
  },
  {
    id: "arduino-10",
    title: "Print Multiplication Table",
    description: "Write a program that prints the multiplication table of a given number.",
    difficulty: "Medium",
    initialCode: "void setup() {\n  Serial.begin(9600);\n  int num = 3;\n  // Your code here\n}\n\nvoid loop() {\n}",
    hint: "Use a for loop to iterate through multiples of the number.",
    explanation: "Multiplication tables can be printed using a loop to multiply the number by values from 1 to 10.",
    expectedOutput: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30"
  }
]

export {sampleproblems}