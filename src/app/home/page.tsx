"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconBookOpen({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    );
}

function IconTrendUp({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 7h8m0 0v8m0-8l-8 14-4-4-6 6" />
        </svg>
    );
}

function IconPlus({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function IconCalendar({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function IconList({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

// ─── Dados Mock Opcionais ──────────────────────────────────────────────────────
const MOCK_EDITAIS = [
    {
        id: "1",
        title: "Edital Polícia Federal 2026",
        sentDate: "28/03/2026",
        topicCount: 45,
        progress: 32,
    },
    {
        id: "2",
        title: "Tribunal de Justiça (TJ-SP)",
        sentDate: "15/02/2026",
        topicCount: 120,
        progress: 85,
    },
    {
        id: "3",
        title: "Auditor Fiscal (Receita)",
        sentDate: "05/01/2026",
        topicCount: 200,
        progress: 10,
    }
];

// Comente os objetos acima e deixe vazio para testar o 'Empty State':
// const MOCK_EDITAIS: any[] = [];

// ─── Componente Home Page ──────────────────────────────────────────────────────

export default function HomePage() {
    const router = useRouter();
    const [userName, setUserName] = useState("Usuário");
    const [stats, setStats] = useState({ abertos: 0, progressoMedio: 0 });

    useEffect(() => {
        // Tentar obter nome do usuário logado no localStorage
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                if (userObj.name) {
                    setUserName(userObj.name.split(" ")[0]); // Exibir primeiro nome
                }
            } catch (e) {
                console.error("Erro ao ler dados de usuário", e);
            }
        }

        // Calcular médias estatísticas
        if (MOCK_EDITAIS.length > 0) {
            const sumProgress = MOCK_EDITAIS.reduce((acc, curr) => acc + curr.progress, 0);
            setStats({
                abertos: MOCK_EDITAIS.length,
                progressoMedio: Math.round(sumProgress / MOCK_EDITAIS.length)
            });
        }
    }, []);

    return (
        <div className="flex flex-col w-full min-h-[calc(100vh-64px)] p-6 md:p-8 space-y-8 animate-in duration-500">
            {/* Cabeçalho */}
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-3xl font-bold tracking-tight text-foreground transition-all">
                    Olá, <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-muted text-sm md:text-base">
                    Vamos continuar seus estudos ou adicione um novo edital.
                </p>
            </header>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                {/* O Card 1: Editais Abertos */}
                <div className="flex flex-col bg-card border border-card-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                            <IconBookOpen size={24} />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Editais abertos</h2>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-extrabold text-foreground">{stats.abertos}</span>
                    </div>
                </div>

                {/* O Card 2: Progresso Médio */}
                <div className="flex flex-col bg-card border border-card-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-colors pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center shrink-0 border border-teal-500/20">
                            <IconTrendUp size={24} />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Progresso médio</h2>
                    </div>
                    <div className="mt-auto flex items-end justify-between">
                        <span className="text-4xl font-extrabold text-foreground">{stats.progressoMedio}%</span>
                        {stats.progressoMedio > 0 && (
                            <div className="text-xs font-medium text-teal-400 flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-md">
                                <IconTrendUp size={12} /> Desempenho
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Seção da lista de editais e Botão 'Novo Edital' */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 mt-4 max-w-5xl">
                <h3 className="text-xl font-bold text-foreground">Meus Editais</h3>
                
                <button
                    onClick={() => router.push('/home/novo-edital')}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/40 active:scale-[0.98] sm:ml-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <IconPlus size={18} />
                    <span>Novo edital</span>
                </button>
            </div>

            {/* Listagem em si */}
            <div className="flex flex-col gap-4 max-w-5xl">
                {MOCK_EDITAIS.length > 0 ? (
                    MOCK_EDITAIS.map((edital) => (
                        <div key={edital.id} className="bg-card border border-card-border p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-primary/40 transition-colors group">
                            
                            {/* Textos Esquerda */}
                            <div className="flex-1 w-full space-y-3">
                                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">
                                    {edital.title}
                                </h4>
                                <div className="flex flex-wrap gap-3 text-sm text-muted">
                                    <span className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-full border border-card-border">
                                        <IconCalendar size={14} /> Enviado em {edital.sentDate}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-full border border-card-border">
                                        <IconList size={14} /> {edital.topicCount} tópicos
                                    </span>
                                </div>
                            </div>

                            {/* Barra de Progresso e Direita */}
                            <div className="w-full md:w-64 space-y-2 shrink-0">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Progresso</span>
                                    <span className="text-sm font-bold text-foreground">{edital.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-card-border relative">
                                    <div 
                                        className="h-full bg-primary transition-all duration-1000 ease-in-out relative z-10"
                                        style={{ width: `${edital.progress}%` }}
                                    >
                                        {/* Efeito luminoso suave na barra (glass) */}
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ícone meramente decorativo para "Abrir" */}
                            <div className="hidden md:flex w-10 h-10 rounded-full bg-background border border-card-border items-center justify-center text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all ml-2 shrink-0 cursor-pointer">
                                <IconBookOpen size={16} />
                            </div>
                        </div>
                    ))
                ) : (
                    // Estado Vazio (Zero State) se nenhum edital for adicionado
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-card/60 border border-dashed border-card-border rounded-2xl text-center space-y-4 max-w-5xl">
                        <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mb-2">
                            <IconBookOpen size={30} />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground">Nenhum edital enviado, vamos começar os estudos?</h4>
                        <p className="text-muted text-sm max-w-md">
                            Adicione o seu primeiro edital clicando no botão acima e organize todas as matérias que você precisará dominar.
                        </p>
                    </div>
                )}
            </div>
            
        </div>
    );
}
