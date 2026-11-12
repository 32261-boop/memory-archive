
const STORAGE_KEY = "memoryArchive2050";
let memories = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);

const modal = $("memoryModal");
const form = $("memoryForm");

const categoryIcons = {
    Pessoal: "✧",
    Viagens: "✈",
    Família: "♡",
    Amigos: "♧",
    Outros: "◈"
};

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);

$("currentDate").textContent = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

$("memoryDate").value = localDate;

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

function formatDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

// Modal
function openModal() {
    modal.classList.add("show");
}

function closeModal() {
    modal.classList.remove("show");
}

$("openModal").addEventListener("click", openModal);
$("coreAdd").addEventListener("click", openModal);
$("emptyAdd").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});

// Criar memória
form.addEventListener("submit", event => {
    event.preventDefault();

    const title = $("memoryTitle").value.trim();
    const description = $("memoryDescription").value.trim();
    const category = $("memoryCategory").value;
    const date = $("memoryDate").value;

    if (!title || !description || !date) return;

    memories.push({
        id: crypto.randomUUID(),
        title,
        description,
        category,
        date
    });

    save();
    form.reset();
    $("memoryDate").value = localDate;

    closeModal();
    showPage("memories");
    render();
});

// Criar elementos de forma segura
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Excluir
function deleteMemory(id) {
    if (!confirm("Tem certeza que deseja excluir esta memória?")) return;

    memories = memories.filter(memory => memory.id !== id);
    save();
    render();
}

// Cartões
function renderMemories() {
    const list = $("memoryList");
    list.replaceChildren();

    const search = $("searchInput").value.toLowerCase().trim();
    const category = $("filterCategory").value;

    let filtered = memories.filter(memory => {
        const matchesSearch =
            memory.title.toLowerCase().includes(search) ||
            memory.description.toLowerCase().includes(search);

        const matchesCategory =
            category === "Todas" || memory.category === category;

        return matchesSearch && matchesCategory;
    });

    if (currentPage === "home" && !search && category === "Todas") {
        filtered = [...filtered]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6);
    } else {
        filtered.sort((a, b) => b.date.localeCompare(a.date));
    }

    filtered.forEach(memory => {
        const card = document.createElement("article");
        card.className = "memory-card";

        const icon = makeElement(
            "div", "memory-icon",
            categoryIcons[memory.category] || "◈"
        );

        const title = makeElement("h3", "", memory.title);
        const description = makeElement("p", "", memory.description);

        const info = document.createElement("div");
        info.className = "memory-info";

        info.append(
            makeElement("span", "category", memory.category),
            makeElement("span", "memory-date", formatDate(memory.date))
        );

        const remove = makeElement("button", "delete-button", "Excluir memória");
        remove.type = "button";
        remove.addEventListener("click", () => deleteMemory(memory.id));

        card.append(icon, title, description, info, remove);
        list.appendChild(card);
    });

    $("emptyState").style.display = filtered.length ? "none" : "block";
}

// Linha do tempo
function renderTimeline() {
    const container = $("timeline");
    container.replaceChildren();

    const sorted = [...memories].sort((a, b) =>
        b.date.localeCompare(a.date)
    );

    if (!sorted.length) {
        container.appendChild(
            makeElement("p", "", "Suas lembranças aparecerão aqui.")
        );
        return;
    }

    sorted.forEach(memory => {
        const item = document.createElement("div");
        item.className = "timeline-item";

        item.append(
            makeElement("span", "", formatDate(memory.date)),
            makeElement("h3", "", memory.title),
            makeElement("p", "", memory.category)
        );

        container.appendChild(item);
    });
}

// Estatísticas
function renderStats() {
    $("totalMemories").textContent = memories.length;

    const categories = new Set(
        memories.map(memory => memory.category)
    );

    $("totalCategories").textContent = categories.size;
}

// Navegação
let currentPage = "home";

function showPage(page, category = null) {
    currentPage = page;

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.remove("active");
    });

    const pageButton = document.querySelector(
        `.nav-link[data-page="${page}"]`
    );

    if (pageButton) pageButton.classList.add("active");

    if (category) {
        $("filterCategory").value = category;
        $("pageName").textContent = category.toUpperCase();
        $("sectionTitle").textContent = `Memórias: ${category}`;
    } else if (page === "timeline") {
        $("pageName").textContent = "TIMELINE";
        $("sectionTitle").textContent = "Todas as memórias";
    } else if (page === "memories") {
        $("pageName").textContent = "ARCHIVE";
        $("sectionTitle").textContent = "Todas as memórias";
    } else {
        $("pageName").textContent = "OVERVIEW";
        $("sectionTitle").textContent = "Memórias recentes";
        $("filterCategory").value = "Todas";
    }

    if (page === "timeline") {
        $("timelineSection").scrollIntoView({ behavior: "smooth" });
    } else {
        $("memoriesSection").scrollIntoView({ behavior: "smooth" });
    }

    render();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
        showPage("memories", button.dataset.category);
    });
});

// Ver todas
$("viewAll").addEventListener("click", () => {
    showPage("memories");
});

// Pesquisa
$("searchInput").addEventListener("input", renderMemories);
$("filterCategory").addEventListener("change", renderMemories);

// Atualização geral
function render() {
    renderStats();
    renderMemories();
    renderTimeline();
}

// Inicialização
render();
