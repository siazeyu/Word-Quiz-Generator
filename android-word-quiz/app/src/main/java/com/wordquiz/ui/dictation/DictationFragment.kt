package com.wordquiz.ui.dictation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.wordquiz.R
import com.wordquiz.WordQuizApp
import com.wordquiz.data.model.DictationItem
import com.wordquiz.data.model.Textbook
import com.wordquiz.data.model.Unit
import com.wordquiz.databinding.FragmentDictationBinding
import kotlinx.coroutines.launch
import kotlin.random.Random

class DictationFragment : Fragment() {
    private var _binding: FragmentDictationBinding? = null
    private val binding get() = _binding!!

    private var textbooks: List<Textbook> = emptyList()
    private var units: List<Unit> = emptyList()
    private var selectedTextbookId: Long = 0
    private var selectedUnitIds: MutableSet<Long> = mutableSetOf()
    private var allDictationItems: List<DictationItem> = emptyList()

    private lateinit var unitAdapter: UnitSelectionAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDictationBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupSpinners()
        setupListeners()
        loadTextbooks()
    }

    private fun setupRecyclerView() {
        unitAdapter = UnitSelectionAdapter { unitId, isSelected ->
            if (isSelected) {
                selectedUnitIds.add(unitId)
            } else {
                selectedUnitIds.remove(unitId)
            }
        }
        binding.rvUnits.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUnits.adapter = unitAdapter
    }

    private fun setupSpinners() {
        binding.spinnerTextbook.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position >= 0 && position < textbooks.size) {
                    selectedTextbookId = textbooks[position].id
                    loadUnitsForTextbook(selectedTextbookId)
                }
            }

            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        })
    }

    private fun setupListeners() {
        binding.btnStart.setOnClickListener {
            startDictation()
        }
    }

    private fun loadTextbooks() {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            app.textbookRepository.allTextbooks.collectLatest { textbookList ->
                textbooks = textbookList
                val adapter = ArrayAdapter(
                    requireContext(),
                    android.R.layout.simple_spinner_item,
                    textbooks.map { it.name }
                )
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                binding.spinnerTextbook.adapter = adapter

                if (textbooks.isNotEmpty()) {
                    selectedTextbookId = textbooks[0].id
                    loadUnitsForTextbook(selectedTextbookId)
                }
            }
        }
    }

    private fun loadUnitsForTextbook(textbookId: Long) {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            app.unitRepository.getUnitsByTextbookId(textbookId).collectLatest { unitList ->
                units = unitList
                selectedUnitIds.clear()
                unitAdapter.submitList(units)
            }
        }
    }

    private fun startDictation() {
        if (selectedUnitIds.isEmpty()) {
            Toast.makeText(requireContext(), "请选择至少一个单元", Toast.LENGTH_SHORT).show()
            return
        }

        val app = requireActivity().application as WordQuizApp
        val direction = if (binding.rbZhToEn.isChecked) "zh_to_en" else "en_to_zh"
        val shuffle = binding.switchShuffle.isChecked
        val showPhonetic = binding.switchPhonetic.isChecked
        val title = binding.etTitle.text.toString().ifEmpty { "默写练习" }

        lifecycleScope.launch {
            val words = app.wordRepository.getWordsByUnitIds(selectedUnitIds.toList())

            var items = words.map { word ->
                DictationItem(
                    prompt = if (direction == "zh_to_en") word.chinese else word.english,
                    answer = if (direction == "zh_to_en") word.english else word.chinese,
                    phonetic = if (showPhonetic) word.phonetic else null,
                    partOfSpeech = word.partOfSpeech
                )
            }

            if (shuffle) {
                items = items.shuffled()
            }

            if (items.isEmpty()) {
                Toast.makeText(requireContext(), "所选单元没有单词", Toast.LENGTH_SHORT).show()
                return@launch
            }

            showDictationDialog(items, title, direction)
        }
    }

    private fun showDictationDialog(items: List<DictationItem>, title: String, direction: String) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_dictation, null)
        val recyclerView = dialogView.findViewById<RecyclerView>(R.id.rv_dictation_items)

        val adapter = DictationItemAdapter(items.toMutableList())
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        recyclerView.adapter = adapter

        AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(dialogView)
            .setPositiveButton("关闭", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
