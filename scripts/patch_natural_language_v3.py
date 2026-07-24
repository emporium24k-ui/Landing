from pathlib import Path
import re

APP = Path("assistente/app.js")
INDEX = Path("assistente/index.html")

source = APP.read_text(encoding="utf-8")

if "NATURAL_LANGUAGE_V3" not in source:
    old_ring_terms = '  const ringTerms = ["alianca","aliancas","anel","aneis","solitario","solitarios"];'
    new_ring_terms = '  const ringTerms = ["alianca","aliancas","aliansa","aliansas","alinca","anel","aneis","solitario","solitarios","aparador","aparadores"];'
    if old_ring_terms not in source:
        raise RuntimeError("Nao encontrei a lista ringTerms esperada")
    source = source.replace(old_ring_terms, new_ring_terms, 1)

    purchase_marker = "  const purchaseTerms = [\n"
    natural_terms = (
        '    "gostaria","gostaria de","queria","queria ver","tenho interesse","me interessei","procuro",\n'
        '    "procurando","estou procurando","to procurando","busco","preciso","preciso de","desejo",\n'
        '    "vim atras","penso em comprar","pretendo comprar","estou querendo","tava querendo","poderia me mostrar",\n'
    )
    if purchase_marker not in source:
        raise RuntimeError("Nao encontrei purchaseTerms")
    source = source.replace(purchase_marker, purchase_marker + natural_terms, 1)

    old_ring_rule = '    if(hasAny(text, ringTerms) && (hasAny(text, purchaseTerms) || hasAny(text, stockTerms) || hasAny(text,["modelos","modelo","disponibilidade","milimetros","milimetragem","gramatura","tamanho"]))) return "rings_order";'
    new_ring_rule = '''    // NATURAL_LANGUAGE_V3: entende desejo, ocasiao e frases indiretas sobre aneis e aliancas.
    const naturalDesireTerms = [
      "quero","queria","gostaria","tenho interesse","me interessei","procuro","procurando","estou procurando",
      "to procurando","busco","preciso","desejo","vim atras","penso em comprar","pretendo comprar",
      "estou querendo","tava querendo","poderia me mostrar"
    ];
    const weddingTerms = ["casamento","casar","casando","matrimonio","bodas","casamento civil"];
    const engagementTerms = ["noivado","noivar","pedido de casamento","pedido de noivado","noiva","noivo"];
    const commitmentTerms = ["compromisso","namoro","namorados","alianca de namoro"];
    const ringDetailTerms = [
      "modelos","modelo","disponibilidade","milimetros","milimetragem","gramatura","tamanho","largura",
      "ouro","prata","18k","925","classica","classico","moderna","moderno","lisa","trabalhada"
    ];
    const hasRingProduct = hasAny(text, ringTerms);
    const hasRingOccasion = hasAny(text, [...weddingTerms, ...engagementTerms, ...commitmentTerms]);
    const hasNaturalPurchaseIntent = hasAny(text, naturalDesireTerms) || hasAny(text, purchaseTerms) || hasAny(text, stockTerms);

    if(hasRingProduct && (hasNaturalPurchaseIntent || hasRingOccasion || hasAny(text, ringDetailTerms) || text.split(" ").length <= 5)) return "rings_order";
    if(!hasRingProduct && hasAny(text, weddingTerms) && (hasAny(text, naturalDesireTerms) || text.split(" ").length <= 4)) return "rings_order";
    if(!hasRingProduct && hasAny(text, engagementTerms) && (hasAny(text, naturalDesireTerms) || text.split(" ").length <= 4)) return "rings_order";'''
    if old_ring_rule not in source:
        raise RuntimeError("Nao encontrei a regra antiga de rings_order")
    source = source.replace(old_ring_rule, new_ring_rule, 1)

    test_marker = "    const tests = [\n"
    extra_tests = '''      ["gostaria de uma aliança de casamento","rings_order"],
      ["eu queria uma alianca para casar","rings_order"],
      ["estou procurando alianças para meu casamento","rings_order"],
      ["preciso de um par de alianças de casamento","rings_order"],
      ["aliança de casamento","rings_order"],
      ["vou casar e queria ver modelos","rings_order"],
      ["quero casar","rings_order"],
      ["gostaria de uma aliança de noivado","rings_order"],
      ["quero alianças de compromisso","rings_order"],
      ["gostaria de uma aliansa","rings_order"],
      ["quero um aparador","rings_order"],
      ["tenho interesse em um solitário","rings_order"],
      ["gostaria de uma corrente","store_products"],
      ["queria comprar um brinco","store_products"],
      ["procuro semijoias","store_semijewelry"],
      ["gostaria de uma joia","commercial"],
'''
    if test_marker not in source:
        raise RuntimeError("Nao encontrei a bateria de testes")
    source = source.replace(test_marker, test_marker + extra_tests, 1)

    APP.write_text(source, encoding="utf-8")

index = INDEX.read_text(encoding="utf-8")
index = re.sub(r'app\.js\?v=[^"\']+', 'app.js?v=natural-v3', index)
INDEX.write_text(index, encoding="utf-8")

print("Natural language V3 aplicado com sucesso")
