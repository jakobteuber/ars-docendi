function renderQuestion() {
    get(
        'question.cgi',
        function (xhr) {
            const { question, number, canSubmit, error } = JSON.parse(xhr.responseText);
            if (error !== undefined) {
                show('inactive');
                return;
            }

            document.getElementById('question-number').innerText = number + 1;

            renderMarkdown(question);

            if (canSubmit === true) {
                show('buttons');
            } else {
                show('alreadySubmitted');
            }
        }
    );
}

renderQuestion()

function postAnswers() {
    function collectAnswers() {
        /*
         * Retrieve answers.
         * For the ease of processing we define an order of answer types in the record:
         * @(y|n) < @[y|n] < @{int:...} < @{float:...} < @{text:...}
         */

        let solution = [];
        document.querySelectorAll('#question .answer-radio').forEach(
            (radio) => solution.push(radio.checked ? "y" : "n")
        );
        document.querySelectorAll('#question .answer-checkbox').forEach(
            (box) => solution.push(box.checked ? "y" : "n")
        );
        document.querySelectorAll('#question .answer-int').forEach(
            (field) => solution.push(field.value)
        );
        document.querySelectorAll('#question .answer-float').forEach(
            (field) => solution.push(field.value)
        );
        document.querySelectorAll('#question .answer-text').forEach(
            (field) => solution.push(field.value)
        );

        return solution;
    }

    post(
        'submission.cgi',
        {
            answer: collectAnswers(),
            questionNumber: parseInt(document.getElementById('question-number').innerText) - 1
        },
        function (xhr) {
            let { exit } = JSON.parse(xhr.responseText);
            if (exit === 'success') {
                show('success');
            } else if (exit === 'rejected') {
                show('submissionRejected');
            } else if (exit === 'alreadySubmitted') {
                show('alreadySubmitted');
            }
            hide('buttons');
        }
    );
}
