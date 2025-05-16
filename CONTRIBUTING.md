# Contributing

We welcome contributions to this project! Please follow these guidelines to ensure a smooth and effective collaboration.

## How to Contribute

1.  **Fork the Repository:** Start by forking the main repository to your own GitHub account.
2.  **Clone the Repository:** Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/AroraShreshth/wasenderapi-sdk.git
    cd YOUR_REPOSITORY
    ```
3.  **Create a Branch:** Create a new branch for your feature or bug fix. Use a descriptive name for your branch.
    ```bash
    git checkout -b feature/your-feature-name
    ```
    or
    ```bash
    git checkout -b bugfix/issue-number-description
    ```
4.  **Make Changes:** Make your desired changes to the codebase.
5.  **Commit Changes:** Commit your changes with a clear and concise commit message. Follow conventional commit message formats if applicable.
    ```bash
    git add .
    git commit -m "feat: add new feature"
    ```
6.  **Push Changes:** Push your changes to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```
7.  **Open a Pull Request (PR):** Go to the original repository on GitHub and open a new Pull Request from your forked repository's branch to the main repository's `main` or `develop` branch.
    - Provide a clear title and description for your PR.
    - Reference any relevant issues (e.g., "Closes #123").
    - Ensure your PR passes all automated checks (linters, tests, etc.).

## Pull Request Process

1.  **Review:** At least one maintainer will review your PR. They may ask for changes or provide feedback.
2.  **Discussion:** Engage in discussions and address any comments or requested changes promptly.
3.  **Merge:** Once the PR is approved and passes all checks, it will be merged by a maintainer.

## Coding Style

Please adhere to the existing coding style in the project. If there is a style guide or linter configuration (e.g., ESLint, Prettier, Black, Flake8), ensure your code conforms to it.

- Write clear, concise, and readable code.
- Comment your code where necessary, especially for complex logic.
- Follow consistent naming conventions.

## Testing

- **Write Tests:** If you are adding a new feature or fixing a bug, please include relevant tests.
- **Run Tests:** Ensure all existing tests pass before submitting your PR.
  ```bash
  # Example command to run tests (adjust as per project setup)
  npm test
  # or
  pytest
  ```

## Code of Conduct

By contributing to this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please ensure your interactions are respectful and constructive.

## Reporting Bugs

If you find a bug, please open an issue on GitHub with the following information:

- A clear and descriptive title.
- Steps to reproduce the bug.
- Expected behavior.
- Actual behavior.
- Your environment (OS, browser, versions, etc.).

## Suggesting Enhancements

If you have an idea for an enhancement, please open an issue on GitHub with:

- A clear and descriptive title.
- A detailed description of the proposed enhancement and its benefits.
- Any potential alternatives or drawbacks.

Thank you for your contributions!
