import { Bench } from 'tinybench';
import { generateTestData, benchmarks } from './scenarios';

async function main() {
  const args = process.argv.slice(2);
  const shouldReport = args.includes('--report');
  
  console.log('IOI Vue Table Performance Benchmarks\n');
  console.log('=' .repeat(50));
  
  const results: Record<string, any> = {};
  
  for (const benchmark of benchmarks) {
    console.log(`\n📊 ${benchmark.name}`);
    console.log('-'.repeat(40));
    
    const bench = new Bench({
      time: 5000,
      iterations: 10,
    });
    
    const data = generateTestData(benchmark.dataSize);
    
    bench.add(benchmark.name, async () => {
      await benchmark.run(data);
    });
    
    await bench.run();
    
    const task = bench.getTask(benchmark.name);
    if (task) {
      const result = task.result!;
      console.log(`  Mean: ${result.mean.toFixed(3)}ms`);
      console.log(`  Min:  ${result.min.toFixed(3)}ms`);
      console.log(`  Max:  ${result.max.toFixed(3)}ms`);
      console.log(`  Std:  ${result.sd.toFixed(3)}ms`);
      
      // Check against target
      const passed = result.mean <= benchmark.targetMs;
      console.log(`  Target: ${benchmark.targetMs}ms - ${passed ? '✅ PASS' : '❌ FAIL'}`);
      
      results[benchmark.name] = {
        mean: result.mean,
        min: result.min,
        max: result.max,
        target: benchmark.targetMs,
        passed,
      };
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter((r: any) => r.passed).length;
  const total = Object.keys(results).length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (shouldReport) {
    // Write JSON report
    const fs = await import('fs');
    await fs.promises.writeFile(
      'benchmark-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\nReport written to benchmark-results.json');
  }
  
  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);
