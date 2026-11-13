const configs = {
  pintura: {help:'Informe as medidas de uma parede e o rendimento da tinta por demão.',fields:[['largura','Largura da parede (m)',null],['altura','Altura da parede (m)',null],['desconto','Portas e janelas (m²)',0,'Área que não receberá pintura.'],['demaos','Número de demãos',2],['rendimento','Rendimento (m²/L por demão)',10,'Confira na embalagem; o valor inicial é um exemplo.'],['sobra','Margem de sobra (%)',10],['preco','Preço por litro (R$)',null,'Opcional: preço da lata dividido pelos litros.']]},
  piso: {help:'Informe as medidas do ambiente e a cobertura da caixa de piso.',fields:[['largura','Largura do ambiente (m)',null],['comprimento','Comprimento do ambiente (m)',null],['cobertura','Cobertura por caixa (m²)',null,'Consulte a embalagem do piso.'],['sobra','Margem para recortes (%)',10,'Ajuste conforme a paginação e os recortes.'],['preco','Preço por caixa (R$)',null,'Opcional.']]},
  contrapiso: {help:'Estime o volume da mistura para uma superfície retangular de espessura uniforme.',fields:[['largura','Largura do ambiente (m)',null],['comprimento','Comprimento do ambiente (m)',null],['espessura','Espessura (cm)',null,'Informe em centímetros. Valide a espessura com um profissional.'],['sobra','Margem de sobra (%)',10],['preco','Preço da mistura por m³ (R$)',null,'Opcional: consulte o fornecedor.']]}
};
const form=document.querySelector('#form'),result=document.querySelector('#result');
let service='pintura';
const fmt=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function render(){
  document.querySelector('#help').textContent=configs[service].help;
  document.querySelector('#fields').innerHTML=configs[service].fields.map(([id,label,value,hint])=>`<label for="${id}">${label}<input id="${id}" name="${id}" type="number" inputmode="decimal" min="${['preco','desconto','sobra'].includes(id)?0:0.01}" step="${id==='demaos'?1:'any'}" ${id==='sobra'?'max="100"':''} ${id==='preco'?'':'required'} ${value===null?'placeholder="'+(id==='preco'?'Opcional':'Ex.: 3')+'"':'value="'+value+'"'} ${hint?'aria-describedby="'+id+'-hint"':''}>${hint?`<small id="${id}-hint">${hint}</small>`:''}</label>`).join('');
  result.innerHTML='<div class="empty-icon" aria-hidden="true">⌂</div><h3>Vamos tirar os planos do papel?</h3><p>Preencha as medidas para descobrir uma estimativa de materiais.</p><p>Um pouco de planejamento faz a diferença.</p>';
}
document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{service=button.dataset.service;document.querySelectorAll('[data-service]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));render();}));
function calculate(type,d){
  const area=d.largura*(type==='pintura'?d.altura:d.comprimento),factor=1+d.sobra/100;
  if(type==='pintura'){
    if(d.desconto>=area)throw new Error('A área de portas e janelas deve ser menor que a área da parede.');
    return {quantity:Math.ceil((area-d.desconto)*d.demaos/d.rendimento*factor*100)/100,unit:'litros de tinta',rows:[['Área a pintar',fmt(area-d.desconto)+' m²'],['Demãos',fmt(d.demaos)]],note:`Área × demãos ÷ rendimento de ${fmt(d.rendimento)} m²/L por demão, com sobra. Arredondado para cima em 0,01 L. Adeque a compra aos tamanhos de lata disponíveis.`};
  }
  if(type==='piso'){
    const boxes=Math.ceil(area*factor/d.cobertura);
    return {quantity:boxes,unit:boxes===1?'caixa de piso':'caixas de piso',rows:[['Área do ambiente',fmt(area)+' m²'],['Área com margem',fmt(area*factor)+' m²'],['Cobertura da compra',fmt(boxes*d.cobertura)+' m²']],note:'Área com margem dividida pela cobertura da caixa, arredondando para caixas inteiras. Argamassa e rejunte não estão incluídos.'};
  }
  const volume=Math.ceil(area*d.espessura/100*factor*1000)/1000;
  return {quantity:volume,unit:'m³ de mistura',rows:[['Área do ambiente',fmt(area)+' m²'],['Espessura',fmt(d.espessura)+' cm'],['Volume em litros',fmt(volume*1000)+' L']],note:'Área × espessura em metros, com sobra. Arredondado para cima em 0,001 m³. As quantidades de cimento e areia dependem do traço e não são estimadas aqui.'};
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  const d=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,v===''?null:Number(v)]));
  try{
    const e=calculate(service,d);
    if(!Number.isFinite(e.quantity)||e.quantity<=0||(d.preco!==null&&!Number.isFinite(e.quantity*d.preco)))throw new Error('Revise as medidas: os valores informados são muito grandes.');
    e.rows.push(['Margem de sobra',fmt(d.sobra)+'%']);
    if(d.preco!==null)e.rows.push(['Custo estimado do material',brl(e.quantity*d.preco)]);
    result.innerHTML=`<span class="eyebrow">VOCÊ VAI PRECISAR DE CERCA DE</span><div class="amount">${fmt(e.quantity)}<span>${e.unit}</span></div>${e.rows.map(([label,value])=>`<div class="row"><span>${label}</span><strong>${value}</strong></div>`).join('')}<p class="assumption">${e.note}</p><p class="assumption">${d.preco===null?'Informe um preço para estimar o custo. ':''}Mão de obra, frete e outros insumos não estão incluídos.</p>`;
  }catch(error){result.textContent=error.message;}
});
render();
