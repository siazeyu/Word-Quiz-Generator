package com.wordquiz.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.wordquiz.R
import com.wordquiz.WordQuizApp
import com.wordquiz.databinding.FragmentHomeBinding
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        loadStats()

        binding.btnStartDictation.setOnClickListener {
            findNavController().navigate(R.id.navigation_dictation)
        }
    }

    private fun loadStats() {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            val textbooksCount = app.textbookRepository.getTextbooksCount()
            val unitsCount = app.unitRepository.getUnitsCount()
            val wordsCount = app.wordRepository.getWordsCount()

            binding.tvTextbooksCount.text = textbooksCount.toString()
            binding.tvUnitsCount.text = unitsCount.toString()
            binding.tvWordsCount.text = wordsCount.toString()
        }
    }

    override fun onResume() {
        super.onResume()
        loadStats()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
