var currentPage = 1;
var pdf = null;
var canvas = document.getElementById('pdf-canvas');
var isPageTurning = false; // 페이지 전환 중 여부
var isNotificationShowing = false; // 알림 표시 중 여부

function loadPage(pageNumber) {
    if (isPageTurning) {
        return; // 페이지 전환 중이라면 중복 실행 방지
    }
    isPageTurning = true;
    pdf.getPage(pageNumber).then(function (page) {
        var context = canvas.getContext('2d');
        // 페이지의 크기를 설정합니다.
        var viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // 페이지를 캔버스에 렌더링합니다.
        var renderContext = {
            canvasContext: context,
            viewport: viewport,
            renderInteractiveForms: true, // 상호작용 양식 렌더링 설정
            renderTextLayer: false, // 텍스트 레이어 렌더링 설정
            highQuality: true // 고화질 렌더링 설정
        };
        page.render(renderContext).promise.then(function () {
            isPageTurning = false; // 페이지 전환 완료
            // 캔버스를 클릭하면 이전 페이지 또는 다음 페이지로 이동합니다.
            canvas.addEventListener('click', function (event) {
                if (!isPageTurning && !isNotificationShowing) {
                    var x = event.clientX - canvas.offsetLeft;
                    var width = canvas.clientWidth;
                    if (x < width / 2) {
                        // 클릭한 위치가 캔버스 왼쪽인 경우 이전 페이지로 이동합니다.
                        if (currentPage > 1) {
                            currentPage--;
                            savePage(currentPage);
                            loadPage(currentPage);
                            updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
                        }
                    }
                    else {
                        // 클릭한 위치가 캔버스 오른쪽인 경우 다음 페이지로 이동합니다.
                        if (currentPage < pdf.numPages) {
                            currentPage++;
                            savePage(currentPage);
                            loadPage(currentPage);
                            updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
                        } else {
                            // 모든 페이지가 끝났을 때 다음 페이지로 이동합니다.
                            const idParam = getQueryParam('id');
                            const numberParam = getQueryParam('number');
                            const nextPage = currentPage + 1;

                            const nextPdfPath = `/data/${idParam}/${nextPage}.pdf`;

                            pdfjsLib.getDocument(nextPdfPath).promise
                                .then(function (instance) {
                                    pdf = instance;
                                    currentPage = 1; // 다음 PDF로 넘어갈 때 페이지를 1페이지로 초기화
                                    savePage(currentPage);
                                    loadPage(currentPage);
                                    updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
                                })
                                .catch(function (error) {
                                    // 다음 페이지에 해당하는 작품이 없을 경우 메인 페이지로 이동
                                    window.location.href = '/';
                                });
                        }
                    }
                }
            });
        });
    });
}

// localStorage에서 마지막으로 저장된 페이지를 로드합니다.
function loadLastVisitedPage() {
    var lastVisitedPage = localStorage.getItem('lastVisitedPage');
    if (lastVisitedPage) {
        var parts = lastVisitedPage.split('/');
        var id = parts[0];
        var number = parseInt(parts[1]);
        var page = parseInt(parts[2]);
        if (idParam === id && numberParam === number) {
            currentPage = page;
        }
    }
    loadPage(currentPage);
}

// 현재 페이지를 localStorage에 저장합니다.
function savePage(pageNumber) {
    var data = idParam + '/' + numberParam + '/' + pageNumber;
    localStorage.setItem('lastVisitedPage', data);
}

// PDF.js 로드가 완료된 후 실행됩니다.
function getQueryParam(param) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

const pageParam = getQueryParam('page');
const idParam = getQueryParam('id');
const numberParam = getQueryParam('number');
console.log(numberParam)
const initialPage = pageParam ? parseInt(pageParam) : 1;
currentPage = initialPage;

if (idParam && numberParam) {
    const id = idParam;
    const number = numberParam;
    const pdfPath = `/data/${id}/${number}.pdf`;

    pdfjsLib.getDocument(pdfPath).promise.then(function (instance) {
        pdf = instance;
        loadLastVisitedPage();
        updateMaxPageNumber(pdf.numPages); // 페이지 수 업데이트
        updateCurrentPage(currentPage);
    }).catch(function (error) {
        window.location.href = '/';
    });
} else {
    window.location.href = '/';
}

// 페이지 번호 변경 함수
function changePage(pageNumber) {
    // 페이지 번호 유효성 확인
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        return; // 유효하지 않은 페이지 번호이므로 종료
    }

    currentPage = pageNumber;
    savePage(currentPage);
    loadPage(currentPage);
    updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
}

// 캔버스 터치 이벤트 처리
var touchStartX;
var touchEndX;
canvas.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
});

canvas.addEventListener('touchend', function (event) {
    touchEndX = event.changedTouches[0].clientX;
    var deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 100 && !isPageTurning && !isNotificationShowing) {
        if (deltaX > 0) {
            // 오른쪽으로 스와이프하여 이전 페이지로 이동
            if (currentPage > 1) {
                currentPage--;
                savePage(currentPage);
                loadPage(currentPage);
                updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
            }
        } else {
            // 왼쪽으로 스와이프하여 다음 페이지로 이동
            if (currentPage < pdf.numPages) {
                currentPage++;
                savePage(currentPage);
                loadPage(currentPage);
                updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
            } else {
                // 모든 페이지가 끝났을 때 다음 페이지로 이동
                const idParam = getQueryParam('id');
                const numberParam = getQueryParam('number');
                const nextPage = currentPage + 1;

                const nextPdfPath = `/data/${idParam}/${nextPage}.pdf`;

                pdfjsLib.getDocument(nextPdfPath).promise
                    .then(function (instance) {
                        pdf = instance;
                        currentPage = 1; // 다음 PDF로 넘어갈 때 페이지를 1페이지로 초기화
                        savePage(currentPage);
                        loadPage(currentPage);
                        updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
                    })
                    .catch(function (error) {
                        // 다음 페이지에 해당하는 작품이 없을 경우 메인 페이지로 이동
                        window.location.href = '/';
                    });
            }
        }
    }
    // 터치 이벤트가 발생했음을 알림
    isNotificationShowing = false;
});

canvas.addEventListener('touchcancel', function () {
    // 터치 이벤트 취소 시 알림 상태 초기화
    isNotificationShowing = false;
});

// 캔버스 더블클릭 이벤트 처리
canvas.addEventListener('dblclick', function () {
    // 알림 상태 초기화
    isNotificationShowing = false;
});

// 알림 상태 감지
function showNotification() {
    isNotificationShowing = true;
}

// 알림 상태 초기화
function resetNotification() {
    isNotificationShowing = false;
}

// 현재 페이지 수 업데이트
function updateMaxPageNumber(maxPageNumber) {
    var maxPageLabel = document.getElementById('max_page_number');
    maxPageLabel.textContent = maxPageNumber;
}

// 현재 페이지 업데이트
function updateCurrentPage(pageNumber) {
    var pageLabel = document.getElementById('page_number');
    pageLabel.textContent = pageNumber;
}


// 페이지 번호 변경 함수
function changePage(pageNumber) {
    // 페이지 번호 유효성 확인
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        showAlert('없는 페이지입니다!');
        return; // 유효하지 않은 페이지 번호이므로 종료
    }

    currentPage = pageNumber;
    savePage(currentPage);
    loadPage(currentPage);
    updateCurrentPage(currentPage); // 현재 페이지 번호 업데이트
}

// 페이지 번호 클릭 이벤트 처리
function pagego() {
    var pageNumber = prompt('이동할 페이지 번호를 입력하세요:');
    if (pageNumber !== null && pageNumber.trim() !== '') {
        pageNumber = parseInt(pageNumber);
        if (!isNaN(pageNumber)) {
            changePage(pageNumber);
        } else {
            showAlert('올바른 페이지 번호를 입력하세요!');
        }
    }
};


function helpPage() {
    var helpPage = document.getElementById('help_page');
    helpPage.style.display = 'none';

    var helpText = document.getElementById('help_text');
    helpText.style.display = 'none';
}
// 알림창 표시 함수
function showAlert(message) {
    alert(message);
}

// 메인화면
function MainPage() {
    location.href="/"
}

// 목록화면
function ListPage() {
    history.back();
}

// 초기 로드 시 현재 페이지 업데이트
updateCurrentPage(currentPage);
