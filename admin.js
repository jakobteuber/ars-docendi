function nextQuestion() {
    post('admin_action.cgi', { action: 'next' }, renderQuestion);
}

function reset() {
    post('admin_action.cgi', { action: 'reset' }, renderSetup);
}

function setup(name) {
    post('admin_action.cgi', { action: 'setup', filename: name },
        () => { hide('setup'); renderQuestion(); }
    );
}

function renderSolution(answer_count, correct_count, solution, result_by_answer) {
    document.querySelector('main').classList.add('with-solution');
    document.getElementById('correct').innerText = correct_count;
    document.getElementById('answerCount').innerText = answer_count;

    let solution_index = 0;

    function setBoxAnswer(query) {
        document.querySelectorAll(query)
            .forEach(function (solutionBox) {
                const c = solution[solution_index] === 'y' ? 'solution-yes' : 'solution-no';
                solutionBox.classList.add(c);
                solution_index++;
            });
    }
    setBoxAnswer('.radio-group .solution-cell');
    setBoxAnswer('.check-group .solution-cell');

    function setFieldAnswer(query) {
        document.querySelectorAll(query)
            .forEach(function (solutionBox) {
                solutionBox.innerText = solution[solution_index];
                solution_index++;
            });
    }
    setFieldAnswer('.int-group .solution');
    setFieldAnswer('.float-group .solution');
    setFieldAnswer('.text-group .solution');

    solution_index = 0;
    function setStatistics(query) {
        document.querySelectorAll(query)
            .forEach(function (solutionBox) {
                const absolut = result_by_answer[solution_index];
                if (absolut > 0) {
                    const percent = (absolut / answer_count) * 99.5;
                    const id = next();
                    solutionBox.innerHTML = `
                        <svg class="bar-chart">
                            <line x1="0" y1="50%" x2="99.5%" y2="50%" class="help"/>
                            <line x1="99.5%" y1="0" x2="99.5%" y2="100%" class="help"/>
                            <rect 
                               id="rect${id}" 
                               x="0%" y="0%" width="${percent}%" height="100%" 
                               class="bar" clip-path="url(#clip${id})"/>
                            <clipPath id="clip${id}"> <use xlink:href="#rect${id}"/> </clipPath>
                        </svg>
                        `;
                }
                solution_index++;
            });
    }
    setStatistics('.radio-group .statistics');
    setStatistics('.check-group .statistics');
    setStatistics('.int-group .statistics');
    setStatistics('.float-group .statistics');
    setStatistics('.text-group .statistics');

    solution_index = 0;
    function setStatsLabel(query) {
        document.querySelectorAll(query)
            .forEach(function (label) {
                const absolut = result_by_answer[solution_index];
                const percent = (absolut / answer_count) * 100;
                if (absolut > 0) {
                    label.innerHTML = `${absolut} (${Math.round(percent)}&#8239;%)`;
                }
                solution_index++;
            });
    }
    setStatsLabel('.radio-group .stats-label');
    setStatsLabel('.check-group .stats-label');
    setStatsLabel('.int-group .stats-label');
    setStatsLabel('.float-group .stats-label');
    setStatsLabel('.text-group .stats-label');

    show('globalStatistics');
}

function displaySolutions() {
    get('solutions.cgi',
        (xhr) => {
            const { answer_count, correct_count, solution, result_by_answer }
                = JSON.parse(xhr.responseText);
            renderSolution(answer_count, correct_count, solution, result_by_answer);
        }
    );
}

function renderSetup() {
    get(
        'question_sets.cgi',
        (xhr) => {
            hide('question');
            hide('buttons');
            const { questionSets } = JSON.parse(xhr.responseText);

            const list = document.createElement('ul');
            list.classList.add('question-sets');
            questionSets.forEach(set_name => {
                const item = document.createElement('li');
                item.innerText = set_name;
                item.onclick = function () { setup(set_name); };
                list.appendChild(item);
            });
            document.getElementById('setup').replaceChildren(list);
            show('setup');
            hide('globalStatistics');
        }
    );
}

function renderQuestion() {
    post(
        'question.cgi',
        null,
        function (xhr) {
            const { question, number, error } = JSON.parse(xhr.responseText);
            if (error) {
                renderSetup();
                return;
            }

            document.getElementById('question-number').innerText = number + 1;
            renderMarkdown(question);

            document.getElementsByTagName('main')[0].classList.remove('with-solution');
            show('question');
            show('buttons');
            hide('globalStatistics');
        }
    );
}

renderQuestion();